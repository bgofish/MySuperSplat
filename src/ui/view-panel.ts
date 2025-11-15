import { BooleanInput, ColorPicker, Container, Label, SelectInput, SliderInput } from '@playcanvas/pcui';
import { Color } from 'playcanvas';

import { Events } from '../events';
import { localize } from './localization';
import { Tooltips } from './tooltips';

class ViewPanel extends Container {
    constructor(events: Events, tooltips: Tooltips, args = {}) {
        args = {
            ...args,
            id: 'view-panel',
            class: 'panel',
            hidden: true,
            style: 'max-height: 80vh; overflow-y: auto;'
        };

        super(args);

        // stop pointer events bubbling
        ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'dblclick'].forEach((eventName) => {
            this.dom.addEventListener(eventName, (event: Event) => event.stopPropagation());
        });

        // header

        const header = new Container({
            class: 'panel-header'
        });

        const icon = new Label({
            text: '\uE403',
            class: 'panel-header-icon'
        });

        const label = new Label({
            text: localize('options'),
            class: 'panel-header-label'
        });

        header.append(icon);
        header.append(label);

        // colors

        const clrRow = new Container({
            class: 'view-panel-row'
        });

        const clrLabel = new Label({
            text: localize('options.colors'),
            class: 'view-panel-row-label'
        });

        const clrPickers = new Container({
            class: 'view-panel-row-pickers'
        });

        const bgClrPicker = new ColorPicker({
            class: 'view-panel-row-picker',
            channels: 3
        });

        const selectedClrPicker = new ColorPicker({
            class: 'view-panel-row-picker',
            channels: 4
        });

        const unselectedClrPicker = new ColorPicker({
            class: 'view-panel-row-picker',
            channels: 4
        });

        const lockedClrPicker = new ColorPicker({
            class: 'view-panel-row-picker',
            channels: 4
        });

        const outlierClrPicker = new ColorPicker({
            class: 'view-panel-row-picker',
            channels: 4
        });

        const toArray = (clr: Color) => {
            return [clr.r, clr.g, clr.b, clr.a];
        };

        const toArray3 = (clr: Color) => {
            return [clr.r, clr.g, clr.b];
        };

        events.on('bgClr', (clr: Color) => {
            bgClrPicker.value = toArray3(clr);
        });

        events.on('selectedClr', (clr: Color) => {
            selectedClrPicker.value = toArray(clr);
        });

        events.on('unselectedClr', (clr: Color) => {
            unselectedClrPicker.value = toArray(clr);
        });

        events.on('lockedClr', (clr: Color) => {
            lockedClrPicker.value = toArray(clr);
        });

        events.on('outlierClr', (clr: Color) => {
            outlierClrPicker.value = toArray(clr);
        });

        clrPickers.append(bgClrPicker);
        clrPickers.append(selectedClrPicker);
        clrPickers.append(unselectedClrPicker);
        clrPickers.append(lockedClrPicker);
        clrPickers.append(outlierClrPicker);

        clrRow.append(clrLabel);
        clrRow.append(clrPickers);

        // tonemapping

        const tonemappingRow = new Container({
            class: 'view-panel-row'
        });

        const tonemappingLabel = new Label({
            text: localize('options.tonemapping'),
            class: 'view-panel-row-label'
        });

        const tonemappingSelection = new SelectInput({
            class: 'view-panel-row-select',
            defaultValue: 'none',
            options: [
                { v: 'none', t: localize('options.tonemapping-none') },
                { v: 'linear', t: localize('options.tonemapping-linear') },
                { v: 'neutral', t: localize('options.tonemapping-neutral') },
                { v: 'aces', t: localize('options.tonemapping-aces') },
                { v: 'aces2', t: localize('options.tonemapping-aces2') },
                { v: 'filmic', t: localize('options.tonemapping-filmic') },
                { v: 'hejl', t: localize('options.tonemapping-hejl') }
            ]
        });

        tonemappingRow.append(tonemappingLabel);
        tonemappingRow.append(tonemappingSelection);

        // camera fov

        const fovRow = new Container({
            class: 'view-panel-row'
        });

        const fovLabel = new Label({
            text: localize('options.fov'),
            class: 'view-panel-row-label'
        });

        const fovSlider = new SliderInput({
            class: 'view-panel-row-slider',
            min: 10,
            max: 120,
            precision: 1,
            value: 60
        });

        fovRow.append(fovLabel);
        fovRow.append(fovSlider);

        // sh bands
        const shBandsRow = new Container({
            class: 'view-panel-row'
        });

        const shBandsLabel = new Label({
            text: localize('options.sh-bands'),
            class: 'view-panel-row-label'
        });

        const shBandsSlider = new SliderInput({
            class: 'view-panel-row-slider',
            min: 0,
            max: 3,
            precision: 0,
            value: 3
        });

        shBandsRow.append(shBandsLabel);
        shBandsRow.append(shBandsSlider);

        // centers size

        const centersSizeRow = new Container({
            class: 'view-panel-row'
        });

        const centersSizeLabel = new Label({
            text: localize('options.centers-size'),
            class: 'view-panel-row-label'
        });

        const centersSizeSlider = new SliderInput({
            class: 'view-panel-row-slider',
            min: 0,
            max: 10,
            precision: 1,
            value: 2
        });

        centersSizeRow.append(centersSizeLabel);
        centersSizeRow.append(centersSizeSlider);

        // camera roll

        const cameraRollRow = new Container({
            class: 'view-panel-row'
        });

        const cameraRollLabel = new Label({
            text: localize('options.camera-roll'),
            class: 'view-panel-row-label'
        });

        const cameraRollSlider = new SliderInput({
            class: 'view-panel-row-slider',
            min: -180,
            max: 180,
            precision: 1,
            value: 0
        });

        cameraRollRow.append(cameraRollLabel);
        cameraRollRow.append(cameraRollSlider);

        // camera fly speed

        const cameraFlySpeedRow = new Container({
            class: 'view-panel-row'
        });

        const cameraFlySpeedLabel = new Label({
            text: localize('options.camera-fly-speed'),
            class: 'view-panel-row-label'
        });

        const cameraFlySpeedSlider = new SliderInput({
            class: 'view-panel-row-slider',
            min: 0.1,
            max: 30,
            precision: 1,
            value: 5
        });

        cameraFlySpeedRow.append(cameraFlySpeedLabel);
        cameraFlySpeedRow.append(cameraFlySpeedSlider);

        // outline selection

        const outlineSelectionRow = new Container({
            class: 'view-panel-row'
        });

        const outlineSelectionLabel = new Label({
            text: localize('options.outline-selection'),
            class: 'view-panel-row-label'
        });

        const outlineSelectionToggle = new BooleanInput({
            type: 'toggle',
            class: 'view-panel-row-toggle',
            value: false
        });

        outlineSelectionRow.append(outlineSelectionLabel);
        outlineSelectionRow.append(outlineSelectionToggle);

        // show grid

        const showGridRow = new Container({
            class: 'view-panel-row'
        });

        const showGridLabel = new Label({
            text: localize('options.show-grid'),
            class: 'view-panel-row-label'
        });

        const showGridToggle = new BooleanInput({
            type: 'toggle',
            class: 'view-panel-row-toggle',
            value: true
        });

        showGridRow.append(showGridLabel);
        showGridRow.append(showGridToggle);

        // show bound

        const showBoundRow = new Container({
            class: 'view-panel-row'
        });

        const showBoundLabel = new Label({
            text: localize('options.show-bound'),
            class: 'view-panel-row-label'
        });

        const showBoundToggle = new BooleanInput({
            type: 'toggle',
            class: 'view-panel-row-toggle',
            value: true
        });

        showBoundRow.append(showBoundLabel);
        showBoundRow.append(showBoundToggle);

        // background cubemap images
        const bgImageRow = new Container({
            class: 'view-panel-row'
        });

        const bgImageLabel = new Label({
            text: 'Skybox Cubemap',
            class: 'view-panel-row-label'
        });

        const bgImageInputs = new Container({
            class: 'view-panel-cubemap-inputs'
        });

        // Store the 6 face URLs
        const cubemapFaces: { [key: string]: string | null } = {
            posx: null,
            negx: null,
            posy: null,
            negy: null,
            posz: null,
            negz: null
        };

        // Status display
        const statusText = document.createElement('div');
        statusText.className = 'view-panel-cubemap-status';
        statusText.textContent = 'Select a folder containing cubemap images';
        statusText.style.fontSize = '11px';
        statusText.style.color = '#999';
        statusText.style.marginBottom = '10px';

        // Create folder input
        const folderInput = document.createElement('input');
        folderInput.type = 'file';
        // @ts-ignore - webkitdirectory is not in TypeScript types but works in browsers
        folderInput.webkitdirectory = true;
        // @ts-ignore
        folderInput.directory = true;
        folderInput.multiple = true;
        folderInput.style.display = 'none';

        const folderButton = document.createElement('button');
        folderButton.textContent = 'Select Folder';
        folderButton.className = 'view-panel-row-button';

        const bgImageClearButton = document.createElement('button');
        bgImageClearButton.textContent = 'Clear';
        bgImageClearButton.className = 'view-panel-row-button';
        bgImageClearButton.style.display = 'none';
        bgImageClearButton.style.marginTop = '10px';

        folderButton.addEventListener('click', () => {
            folderInput.click();
        });

        // Suffix patterns to look for (in order of preference)
        const suffixPatterns = {
            posx: ['right', 'posx', 'px', 'pos-x', '+x'],
            negx: ['left', 'negx', 'nx', 'neg-x', '-x'],
            posy: ['top', 'up', 'posy', 'py', 'pos-y', '+y'],
            negy: ['bottom', 'down', 'negy', 'ny', 'neg-y', '-y'],
            posz: ['front', 'forward', 'posz', 'pz', 'pos-z', '+z'],
            negz: ['back', 'backward', 'negz', 'nz', 'neg-z', '-z']
        };

        folderInput.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const files = Array.from(target.files || []);

            console.log(`Selected ${files.length} files from folder`);

            // Reset faces
            Object.keys(cubemapFaces).forEach((key) => {
                cubemapFaces[key] = null;
            });

            // Try to match files to faces
            const foundFaces: string[] = [];

            for (const [face, patterns] of Object.entries(suffixPatterns)) {
                for (const pattern of patterns) {
                    const matchedFile = files.find((file) => {
                        const name = file.name.toLowerCase();
                        const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name;
                        // Check if filename contains or ends with the pattern
                        return nameWithoutExt.includes(pattern) || nameWithoutExt.endsWith(pattern);
                    });

                    if (matchedFile) {
                        console.log(`Matched ${face} to file: ${matchedFile.name}`);
                        foundFaces.push(face);

                        const reader = new FileReader();
                        reader.onload = (event) => {
                            cubemapFaces[face] = event.target?.result as string;

                            // Check if all faces are loaded
                            const allLoaded = Object.values(cubemapFaces).every(f => f !== null);
                            if (allLoaded) {
                                console.log('All 6 cubemap faces loaded from folder');
                                events.fire('setBackgroundCubemap', { ...cubemapFaces });
                                bgImageClearButton.style.display = 'inline-block';
                                statusText.textContent = '✓ Cubemap loaded successfully';
                                statusText.style.color = '#4CAF50';
                            } else {
                                const loaded = Object.values(cubemapFaces).filter(f => f !== null).length;
                                statusText.textContent = `Loading... ${loaded}/6 faces found`;
                                statusText.style.color = '#FFA500';
                            }
                        };
                        reader.onerror = () => {
                            console.error(`Error reading file for ${face}`);
                        };
                        reader.readAsDataURL(matchedFile);
                        break; // Found a match, stop looking for this face
                    }
                }
            }

            if (foundFaces.length === 0) {
                statusText.textContent = '✗ No cubemap images found in folder';
                statusText.style.color = '#f44336';
            } else if (foundFaces.length < 6) {
                statusText.textContent = `⚠ Only found ${foundFaces.length}/6 faces: ${foundFaces.join(', ')}`;
                statusText.style.color = '#FFA500';
            }
        });

        bgImageClearButton.addEventListener('click', () => {
            events.fire('clearBackgroundImage');

            // Reset all data
            Object.keys(cubemapFaces).forEach((key) => {
                cubemapFaces[key] = null;
            });

            folderInput.value = '';
            bgImageClearButton.style.display = 'none';
            statusText.textContent = 'Select a folder containing cubemap images';
            statusText.style.color = '#999';
        });

        bgImageInputs.dom.appendChild(statusText);
        bgImageInputs.dom.appendChild(folderInput);
        bgImageInputs.dom.appendChild(folderButton);
        bgImageInputs.dom.appendChild(bgImageClearButton);

        bgImageRow.append(bgImageLabel);
        bgImageRow.append(bgImageInputs);

        this.append(header);
        this.append(clrRow);
        this.append(tonemappingRow);
        this.append(fovRow);
        this.append(shBandsRow);
        this.append(centersSizeRow);
        this.append(cameraRollRow);
        this.append(cameraFlySpeedRow);
        this.append(outlineSelectionRow);
        this.append(showGridRow);
        this.append(showBoundRow);
        this.append(bgImageRow);

        // handle panel visibility

        const setVisible = (visible: boolean) => {
            if (visible === this.hidden) {
                this.hidden = !visible;
                events.fire('viewPanel.visible', visible);
            }
        };

        events.function('viewPanel.visible', () => {
            return !this.hidden;
        });

        events.on('viewPanel.setVisible', (visible: boolean) => {
            setVisible(visible);
        });

        events.on('viewPanel.toggleVisible', () => {
            setVisible(this.hidden);
        });

        events.on('colorPanel.visible', (visible: boolean) => {
            if (visible) {
                setVisible(false);
            }
        });

        // hide this panel when depth visualization panel opens
        events.on('depthVisualizationPanel.visible', (visible: boolean) => {
            if (visible) {
                setVisible(false);
            }
        });

        // sh bands

        events.on('view.bands', (bands: number) => {
            shBandsSlider.value = bands;
        });

        shBandsSlider.on('change', (value: number) => {
            events.fire('view.setBands', value);
        });

        // splat size

        events.on('camera.splatSize', (value: number) => {
            centersSizeSlider.value = value;
        });

        centersSizeSlider.on('change', (value: number) => {
            events.fire('camera.setSplatSize', value);
            events.fire('camera.setOverlay', true);
            events.fire('camera.setMode', 'centers');
        });

        // camera speed

        events.on('camera.flySpeed', (value: number) => {
            cameraFlySpeedSlider.value = value;
        });

        cameraFlySpeedSlider.on('change', (value: number) => {
            events.fire('camera.setFlySpeed', value);
        });

        // camera roll

        events.on('camera.roll', (value: number) => {
            cameraRollSlider.value = value;
        });

        cameraRollSlider.on('change', (value: number) => {
            events.fire('camera.setRoll', value);
        });

        // outline selection

        events.on('view.outlineSelection', (value: boolean) => {
            outlineSelectionToggle.value = value;
        });

        outlineSelectionToggle.on('change', (value: boolean) => {
            events.fire('view.setOutlineSelection', value);
        });

        // show grid

        events.on('grid.visible', (visible: boolean) => {
            showGridToggle.value = visible;
        });

        showGridToggle.on('change', () => {
            events.fire('grid.setVisible', showGridToggle.value);
        });

        // show bound

        events.on('camera.bound', (visible: boolean) => {
            showBoundToggle.value = visible;
        });

        showBoundToggle.on('change', () => {
            events.fire('camera.setBound', showBoundToggle.value);
        });

        // background color

        bgClrPicker.on('change', (value: number[]) => {
            events.fire('setBgClr', new Color(value[0], value[1], value[2]));
        });

        selectedClrPicker.on('change', (value: number[]) => {
            events.fire('setSelectedClr', new Color(value[0], value[1], value[2], value[3]));
        });

        unselectedClrPicker.on('change', (value: number[]) => {
            events.fire('setUnselectedClr', new Color(value[0], value[1], value[2], value[3]));
        });

        lockedClrPicker.on('change', (value: number[]) => {
            events.fire('setLockedClr', new Color(value[0], value[1], value[2], value[3]));
        });

        outlierClrPicker.on('change', (value: number[]) => {
            events.fire('setOutlierClr', new Color(value[0], value[1], value[2], value[3]));
        });

        // camera fov

        events.on('camera.fov', (fov: number) => {
            fovSlider.value = fov;
        });

        fovSlider.on('change', (value: number) => {
            events.fire('camera.setFov', value);
        });

        // tonemapping

        events.on('camera.tonemapping', (tonemapping: string) => {
            tonemappingSelection.value = tonemapping;
        });

        tonemappingSelection.on('change', (value: string) => {
            events.fire('camera.setTonemapping', value);
        });

        // background image state
        events.on('backgroundImage.set', (hasImage: boolean) => {
            bgImageClearButton.style.display = hasImage ? 'inline-block' : 'none';
        });

        // tooltips
        tooltips.register(bgClrPicker, localize('options.bg-color'), 'left');
        tooltips.register(selectedClrPicker, localize('options.selected-color'), 'top');
        tooltips.register(unselectedClrPicker, localize('options.unselected-color'), 'top');
        tooltips.register(lockedClrPicker, localize('options.locked-color'), 'top');
        tooltips.register(outlierClrPicker, localize('options.outlier-color'), 'top');

        // Force initial color update after a short delay to ensure events system is ready
        setTimeout(() => {
            const currentBgClr = events.invoke('bgClr');
            const currentSelectedClr = events.invoke('selectedClr');
            const currentUnselectedClr = events.invoke('unselectedClr');
            const currentLockedClr = events.invoke('lockedClr');
            const currentOutlierClr = events.invoke('outlierClr');

            if (currentBgClr) bgClrPicker.value = toArray3(currentBgClr);
            if (currentSelectedClr) selectedClrPicker.value = toArray(currentSelectedClr);
            if (currentUnselectedClr) unselectedClrPicker.value = toArray(currentUnselectedClr);
            if (currentLockedClr) lockedClrPicker.value = toArray(currentLockedClr);
            if (currentOutlierClr) outlierClrPicker.value = toArray(currentOutlierClr);
        }, 100);
    }
}

export { ViewPanel };
