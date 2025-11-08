import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { path, Vec3, Entity } from 'playcanvas';

import { ElementType } from './element';
import { Events } from './events';
import { PngCompressor } from './png-compressor';
import { Scene } from './scene';
import { Splat } from './splat';
import { localize } from './ui/localization';

type ImageSettings = {
    width: number;
    height: number;
    transparentBg: boolean;
    showDebug: boolean;
};

type VideoSettings = {
    startFrame: number;
    endFrame: number;
    frameRate: number;
    width: number;
    height: number;
    bitrate: number;
    transparentBg: boolean;
    showDebug: boolean;
    stereo3d?: boolean;
    eyeSeparation?: number;	
};

const removeExtension = (filename: string) => {
    return filename.substring(0, filename.length - path.getExtension(filename).length);
};

const downloadFile = (arrayBuffer: ArrayBuffer, filename: string) => {
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.download = filename;
    el.href = url;
    el.click();
    window.URL.revokeObjectURL(url);
};

const registerRenderEvents = (scene: Scene, events: Events) => {
    let compressor: PngCompressor;

    // wait for postrender to fire
    const postRender = () => {
        return new Promise<boolean>((resolve, reject) => {
            const handle = scene.events.on('postrender', () => {
                handle.off();
                try {
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            });
        });
    };

    events.function('render.image', async (imageSettings: ImageSettings) => {
        events.fire('startSpinner');

        try {
            const { width, height, transparentBg, showDebug } = imageSettings;
            const bgClr = events.invoke('bgClr');

            // start rendering to offscreen buffer only
            scene.camera.startOffscreenMode(width, height);
            scene.camera.renderOverlays = showDebug;
            if (!transparentBg) {
                scene.camera.entity.camera.clearColor.copy(bgClr);
            }

            // render the next frame
            scene.forceRender = true;

            // for render to finish
            await postRender();

            // cpu-side buffer to read pixels into
            const data = new Uint8Array(width * height * 4);

            const { renderTarget } = scene.camera.entity.camera;
            const { colorBuffer } = renderTarget;

            // read the rendered frame
            await colorBuffer.read(0, 0, width, height, { renderTarget, data });

            // the render buffer contains premultiplied alpha. so apply background color.
            if (!transparentBg) {
                // @ts-ignore
                const pixels = new Uint8ClampedArray(data.buffer);

                const { r, g, b } = bgClr;
                for (let i = 0; i < pixels.length; i += 4) {
                    const a = 255 - pixels[i + 3];
                    pixels[i + 0] += r * a;
                    pixels[i + 1] += g * a;
                    pixels[i + 2] += b * a;
                    pixels[i + 3] = 255;
                }
            }

            // construct the png compressor
            if (!compressor) {
                compressor = new PngCompressor();
            }

            const arrayBuffer = await compressor.compress(
                new Uint32Array(data.buffer),
                colorBuffer.width,
                colorBuffer.height
            );

            // construct filename
            const selected = events.invoke('selection') as Splat;
            const filename = `${removeExtension(selected?.name ?? 'SuperSplat')}-image.png`;

            // download
            downloadFile(arrayBuffer, filename);

            return true;
        } catch (error) {
            await events.invoke('showPopup', {
                type: 'error',
                header: localize('render.failed'),
                message: `'${error.message ?? error}'`
            });
        } finally {
            scene.camera.endOffscreenMode();
            scene.camera.renderOverlays = true;
            scene.camera.entity.camera.clearColor.set(0, 0, 0, 0);

            events.fire('stopSpinner');
        }
    });

    events.function('render.video', async (videoSettings: VideoSettings) => {
        events.fire('progressStart', localize('render.render-video'));

        // Store original camera for restoration
        let leftEyeCamera: Entity | null = null;
        let rightEyeCamera: Entity | null = null;
        const originalCamera = scene.camera;
        const originalCameraPos = new Vec3();
        const originalCameraRot = scene.camera.entity.getRotation().clone();

        try {
            const { startFrame, endFrame, frameRate, width, height, bitrate, transparentBg, showDebug, stereo3d, eyeSeparation } = videoSettings;

            // For stereo 3D, each eye's view is half the total height
            const renderHeight = stereo3d ? height / 2 : height;

            const muxer = new Muxer({
                target: new ArrayBufferTarget(),
                video: {
                    codec: 'avc',
                    width,
                    height
                },
                fastStart: 'in-memory',
                firstTimestampBehavior: 'offset'
            });

            const encoder = new VideoEncoder({
                output: (chunk, meta) => {
                    muxer.addVideoChunk(chunk, meta);
                },
                error: (error) => {
                    console.log(error);
                }
            });

            encoder.configure({
                codec: height < 1080 ? 'avc1.420028' : 'avc1.640033',
                width,
                height,
                bitrate
            });

            // Setup stereo cameras if needed
            if (stereo3d && eyeSeparation) {
                originalCameraPos.copy(scene.camera.entity.getPosition());
            }

            // start rendering to offscreen buffer
            scene.camera.startOffscreenMode(width, renderHeight);
            scene.camera.renderOverlays = showDebug;
            if (!transparentBg) {
                scene.camera.entity.camera.clearColor.copy(events.invoke('bgClr'));
            }
            scene.lockedRenderMode = true;

            // cpu-side buffers
            const data = new Uint8Array(width * renderHeight * 4);
            const line = new Uint8Array(width * 4);
            const compositeData = stereo3d ? new Uint8Array(width * height * 4) : null;

            // get the list of visible splats
            const splats = (scene.getElementsByType(ElementType.splat) as Splat[]).filter(splat => splat.visible);

            // remember last camera position
            const last_pos = new Vec3(0, 0, 0);
            const last_forward = new Vec3(1, 0, 0);

            // prepare the frame for rendering
            const prepareFrame = async (frameTime: number, cameraEntity?: Entity) => {
                events.fire('timeline.time', frameTime);

                // manually update the camera
                const cam = cameraEntity || scene.camera.entity;
                scene.camera.onUpdate(0);

                // if the camera didn't move, don't sort
                const pos = cam.getPosition();
                const forward = cam.forward;
                if (last_pos.equals(pos) && last_forward.equals(forward)) {
                    return;
                }

                // update remembered position
                last_pos.copy(pos);
                last_forward.copy(forward);

                // wait for sorting to complete
                await Promise.all(splats.map((splat) => {
                    return new Promise<void>((resolve) => {
                        const { instance } = splat.entity.gsplat;

                        const handle = instance.sorter.on('updated', () => {
                            handle.off();
                            resolve();
                        });

                        instance.sort(cam);

                        setTimeout(() => {
                            resolve();
                        }, 1000);
                    });
                }));
            };

            // capture a single view for stereo
            const captureStereoView = async (offsetX: number) => {
                // Store original position
                const origPos = scene.camera.entity.getPosition().clone();
                
                // Offset camera position
                const right = scene.camera.entity.right;
                const offset = right.clone().mulScalar(offsetX);
                scene.camera.entity.setPosition(origPos.clone().add(offset));
                
                // Update camera
                scene.camera.onUpdate(0);
                
                // Render
                scene.lockedRender = true;
                await postRender();
                
                const { renderTarget } = scene.camera.entity.camera;
                const { colorBuffer } = renderTarget;

                // Read the rendered frame
                await colorBuffer.read(0, 0, width, renderHeight, { renderTarget, data });

                // Flip the buffer vertically
                for (let y = 0; y < renderHeight / 2; y++) {
                    const top = y * width * 4;
                    const bottom = (renderHeight - y - 1) * width * 4;
                    line.set(data.subarray(top, top + width * 4));
                    data.copyWithin(top, bottom, bottom + width * 4);
                    data.set(line, bottom);
                }
                
                // Restore original position
                scene.camera.entity.setPosition(origPos);
                
                return new Uint8Array(data);
            };

            // capture the current video frame (mono or stereo)
            const captureFrame = async (frameTime: number) => {
                if (stereo3d && eyeSeparation && compositeData) {
                    // Capture left eye (top half) - offset left
                    const leftData = await captureStereoView(-eyeSeparation / 2);
                    compositeData.set(leftData, 0);

                    // Capture right eye (bottom half) - offset right
                    const rightData = await captureStereoView(eyeSeparation / 2);
                    compositeData.set(rightData, width * renderHeight * 4);

                    // Create video frame with composite data
                    const videoFrame = new VideoFrame(compositeData, {
                        format: 'RGBA',
                        codedWidth: width,
                        codedHeight: height,
                        timestamp: Math.floor(1e6 * frameTime),
                        duration: Math.floor(1e6 / frameRate)
                    });
                    encoder.encode(videoFrame);
                    videoFrame.close();
                } else {
                    // Standard mono rendering
                    const { renderTarget } = scene.camera.entity.camera;
                    const { colorBuffer } = renderTarget;

                    await colorBuffer.read(0, 0, width, renderHeight, { renderTarget, data });

                    // flip the buffer vertically
                    for (let y = 0; y < renderHeight / 2; y++) {
                        const top = y * width * 4;
                        const bottom = (renderHeight - y - 1) * width * 4;
                        line.set(data.subarray(top, top + width * 4));
                        data.copyWithin(top, bottom, bottom + width * 4);
                        data.set(line, bottom);
                    }

                    const videoFrame = new VideoFrame(data, {
                        format: 'RGBA',
                        codedWidth: width,
                        codedHeight: renderHeight,
                        timestamp: Math.floor(1e6 * frameTime),
                        duration: Math.floor(1e6 / frameRate)
                    });
                    encoder.encode(videoFrame);
                    videoFrame.close();
                }
            };

            const animFrameRate = events.invoke('timeline.frameRate');
            const duration = (endFrame - startFrame) / animFrameRate;

            for (let frameTime = 0; frameTime <= duration; frameTime += 1.0 / frameRate) {
                await prepareFrame(startFrame + frameTime * animFrameRate, scene.camera.entity);

                if (!stereo3d) {
                    // Standard mono render
                    scene.lockedRender = true;
                    await postRender();
                }

                await captureFrame(frameTime);

                events.fire('progressUpdate', {
                    text: localize('render.rendering'),
                    progress: 100 * frameTime / duration
                });
            }

            // Flush and finalize muxer
            await encoder.flush();
            muxer.finalize();

            // Download
            const suffix = stereo3d ? '-stereo3d-video.mp4' : '-video.mp4';
            downloadFile(muxer.target.buffer, `${removeExtension(splats[0]?.name ?? 'SuperSplat')}${suffix}`);

            // Free resources
            encoder.close();

            return true;
        } catch (error) {
            await events.invoke('showPopup', {
                type: 'error',
                header: localize('render.failed'),
                message: `'${error.message ?? error}'`
            });
        } finally {
            scene.camera.endOffscreenMode();
            scene.camera.renderOverlays = true;
            scene.camera.entity.camera.clearColor.set(0, 0, 0, 0);
            scene.lockedRenderMode = false;
            scene.forceRender = true;

            events.fire('progressEnd');
        }
    });
};

export { ImageSettings, VideoSettings, registerRenderEvents };