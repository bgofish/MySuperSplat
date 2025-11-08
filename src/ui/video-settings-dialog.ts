import { BooleanInput, Button, Container, Element, Label, SelectInput, NumericInput } from '@playcanvas/pcui';

import { Events } from '../events';
import { VideoSettings } from '../render';
import { localize } from './localization';
import sceneExport from './svg/export.svg';

const createSvg = (svgString: string, args = {}) => {
    const decodedStr = decodeURIComponent(svgString.substring('data:image/svg+xml,'.length));
    return new Element({
        dom: new DOMParser().parseFromString(decodedStr, 'image/svg+xml').documentElement,
        ...args
    });
};

class VideoSettingsDialog extends Container {
    show: () => Promise<VideoSettings | null>;
    hide: () => void;
    destroy: () => void;

    constructor(events: Events, args = {}) {
        args = {
            ...args,
            id: 'video-settings-dialog',
            class: 'settings-dialog',
            hidden: true,
            tabIndex: -1
        };

        super(args);

        const dialog = new Container({
            id: 'dialog'
        });

        // header

        const headerIcon = createSvg(sceneExport, { id: 'icon' });
        const headerText = new Label({ id: 'text', text: localize('video.header') });
        const header = new Container({ id: 'header' });
        header.append(headerIcon);
        header.append(headerText);

        // resolution

        const resolutionLabel = new Label({ class: 'label', text: localize('video.resolution') });
        const resolutionSelect = new SelectInput({
            class: 'select',
            defaultValue: '1080',
            options: [
                { v: '540', t: '960x540' },
                { v: '720', t: '1280x720' },
                { v: '1080', t: '1920x1080' },
                { v: '1440', t: '2560x1440' },
                { v: '4k', t: '3840x2160' }
            ]
        });
        const resolutionRow = new Container({ class: 'row' });
        resolutionRow.append(resolutionLabel);
        resolutionRow.append(resolutionSelect);

        // framerate

        const frameRateLabel = new Label({ class: 'label', text: localize('video.frameRate') });
        const frameRateSelect = new SelectInput({
            class: 'select',
            defaultValue: '30',
            options: [
                { v: '12', t: '12 fps' },
                { v: '24', t: '24 fps' },
                { v: '30', t: '30 fps' },
                { v: '60', t: '60 fps' },
                { v: '120', t: '120 fps' }
            ]
        });

        const frameRateRow = new Container({ class: 'row' });
        frameRateRow.append(frameRateLabel);
        frameRateRow.append(frameRateSelect);

        // bitrate

        const bitrateLabel = new Label({ class: 'label', text: localize('video.bitrate') });
        const bitrateSelect = new SelectInput({
            class: 'select',
            defaultValue: 'high',
            options: [
                { v: 'low', t: 'Low' },
                { v: 'medium', t: 'Medium' },
                { v: 'high', t: 'High' },
                { v: 'ultra', t: 'Ultra' }
            ]
        });
        const bitrateRow = new Container({ class: 'row' });
        bitrateRow.append(bitrateLabel);
        bitrateRow.append(bitrateSelect);

        // portrait mode

        const portraitLabel = new Label({ class: 'label', text: localize('video.portrait') });
        const portraitBoolean = new BooleanInput({ class: 'boolean', value: false });
        const portraitRow = new Container({ class: 'row' });
        portraitRow.append(portraitLabel);
        portraitRow.append(portraitBoolean);

        // stereoscopic 3D (top/bottom)

        const stereo3dLabel = new Label({ class: 'label', text: localize('video.stereo3d') });
        const stereo3dBoolean = new BooleanInput({ class: 'boolean', value: false });
        const stereo3dRow = new Container({ class: 'row' });
        stereo3dRow.append(stereo3dLabel);
        stereo3dRow.append(stereo3dBoolean);

        // eye separation (only visible when stereo 3D is enabled)

        const eyeSeparationLabel = new Label({ class: 'label', text: localize('video.eyeSeparation') });
        const eyeSeparationInput = new NumericInput({ 
            class: 'numeric', 
            value: 0.064,  // Default 64mm (average human IPD)
            precision: 3,
            step: 0.001,
            min: 0.001,
            max: 1.0
        });
        const eyeSeparationRow = new Container({ class: 'row' });
        eyeSeparationRow.append(eyeSeparationLabel);
        eyeSeparationRow.append(eyeSeparationInput);
        eyeSeparationRow.hidden = true; // Hidden by default

        // Show/hide eye separation based on stereo 3D toggle
        stereo3dBoolean.on('change', (value: boolean) => {
            eyeSeparationRow.hidden = !value;
        });

        // transparent background

        const transparentBgLabel = new Label({ class: 'label', text: localize('video.transparentBg') });
        const transparentBgBoolean = new BooleanInput({ class: 'boolean', value: false });
        const transparentBgRow = new Container({ class: 'row' });
        transparentBgRow.append(transparentBgLabel);
        transparentBgRow.append(transparentBgBoolean);

        // hide transparent background till we add support for webm
        // video container
        transparentBgRow.hidden = true;

        // show debug overlays

        const showDebugLabel = new Label({ class: 'label', text: localize('video.showDebug') });
        const showDebugBoolean = new BooleanInput({ class: 'boolean', value: false });
        const showDebugRow = new Container({ class: 'row' });
        showDebugRow.append(showDebugLabel);
        showDebugRow.append(showDebugBoolean);

        // content

        const content = new Container({ id: 'content' });
        content.append(resolutionRow);
        content.append(frameRateRow);
        content.append(bitrateRow);
        content.append(portraitRow);
        content.append(stereo3dRow);
        content.append(eyeSeparationRow);
        content.append(transparentBgRow);
        content.append(showDebugRow);

        // footer

        const footer = new Container({ id: 'footer' });

        const cancelButton = new Button({
            class: 'button',
            text: localize('render.cancel')
        });

        const okButton = new Button({
            class: 'button',
            text: localize('render.ok')
        });

        footer.append(cancelButton);
        footer.append(okButton);

        dialog.append(header);
        dialog.append(content);
        dialog.append(footer);

        this.append(dialog);

        // handle key bindings for enter and escape

        let onCancel: () => void;
        let onOK: () => void;

        cancelButton.on('click', () => onCancel());
        okButton.on('click', () => onOK());

        const keydown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onCancel();
                    break;
                case 'Enter':
                    if (!e.shiftKey) onOK();
                    break;
                default:
                    e.stopPropagation();
                    break;
            }
        };

        // reset UI and configure for current state
        const reset = () => {

        };

        // function implementations

        this.show = () => {
            reset();

            this.hidden = false;
            this.dom.addEventListener('keydown', keydown);
            this.dom.focus();

            return new Promise<VideoSettings | null>((resolve) => {
                onCancel = () => {
                    resolve(null);
                };

                onOK = () => {

                    const widths: Record<string, number> = {
                        '540': 960,
                        '720': 1280,
                        '1080': 1920,
                        '1440': 2560,
                        '4k': 3840
                    };

                    const heights: Record<string, number> = {
                        '540': 540,
                        '720': 720,
                        '1080': 1080,
                        '1440': 1440,
                        '4k': 2160
                    };

                    const frameRates: Record<string, number> = {
                        '12': 12,
                        '24': 24,
                        '30': 30,
                        '60': 60,
                        '120': 120
                    };

                    // bits per pixel per frame for different quality settings
                    const bppfs: Record<string, number> = {
                        'low': 0.001,
                        'medium': 0.01,
                        'high': 0.1,
                        'ultra': 1
                    };

                    // scale down higher resolutions
                    const bbpfFactors: Record<string, number> = {
                        '540': 1,
                        '720': 1 / 2,
                        '1080': 1 / 3,
                        '1440': 1 / 4,
                        '4k': 1 / 5
                    };

                    const portrait = portraitBoolean.value;
                    const stereo3d = stereo3dBoolean.value;
                    
                    let width = (portrait ? heights : widths)[resolutionSelect.value];
                    let height = (portrait ? widths : heights)[resolutionSelect.value];
                    
                    // For stereo 3D top/bottom, double the height to accommodate both views
                    if (stereo3d) {
                        height *= 2;
                    }
                    
                    const frameRate = frameRates[frameRateSelect.value];
                    const bppf = bppfs[bitrateSelect.value] * bbpfFactors[resolutionSelect.value];
                    // bitrate (bps) = 100m * (width × height × frame rate × bppf) / 1m
                    const bitrate = Math.floor(10 * width * height * frameRate * bppf);

                    const videoSettings = {
                        startFrame: 0,
                        endFrame: events.invoke('timeline.frames') - 1,
                        frameRate,
                        width,
                        height,
                        bitrate,
                        transparentBg: transparentBgBoolean.value,
                        showDebug: showDebugBoolean.value,
                        stereo3d: stereo3d,
                        eyeSeparation: stereo3d ? eyeSeparationInput.value : undefined
                    };

                    resolve(videoSettings);
                };
            }).finally(() => {
                this.dom.removeEventListener('keydown', keydown);
                this.hide();
            });
        };

        this.hide = () => {
            this.hidden = true;
        };

        this.destroy = () => {
            this.hide();
            super.destroy();
        };
    }
}

export { VideoSettingsDialog };