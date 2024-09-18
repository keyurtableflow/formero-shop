import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    Optional,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as JSZip from 'jszip';
import { MatIconModule } from '@angular/material/icon';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FileManagementService } from 'app/core/services/file-management.service';

@Component({
    selector: 'app-modelviewer',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatDialogModule,
        NgIf,
        MatTooltipModule,
        MatCheckboxModule,
        MatRadioModule,
        FormsModule,
        ReactiveFormsModule
    ],
    templateUrl: './modelviewer.component.html',
    styleUrls: ['./modelviewer.component.scss'],
})
export class ModelviewerComponent {
    @ViewChild('canvas', { static: true })
    private canvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('thumbnailCanvas', { static: true })
    private thumbnailCanvasRef!: ElementRef<HTMLCanvasElement>;

    @Input() files: any;
    @Input() degree: number = 270;
    @Input() printerSize: { X: number; Y: number; Z: number };
    @Input() errors: {isMetricError:boolean,model_is_fit:boolean} ;

    @Output() onCoordinatePosition = new EventEmitter<any>();
    @Output() thumbnail = new EventEmitter<any>();

    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private controls!: OrbitControls;
    private ambientLight!: THREE.AmbientLight;
    private directionalLight!: THREE.DirectionalLight;
    private model: THREE.Object3D | null = null;
    private gridHelper: THREE.GridHelper | null = null;
    private axisHelper: THREE.AxesHelper | null = null;
    private modelBoxHelper: THREE.BoxHelper | null = null;
    private isGridVisible: boolean = false;
    private isAxisVisible: boolean = true;
    private isModelBoxVisible: boolean = false;
    private isDarkMode: boolean = false;
    private thinLinesVisible: boolean = false;
    private printerBox: THREE.Mesh | null = null;
    private isPrinterBoxVisible: boolean = true;
    isRenderMode: boolean = false;
    thumbnailSrc: string = "";
    isView: boolean = false;
    selectedOption: string = 'solid';
    selectedColorMode: string = 'light';
    is3DAxesChecked: boolean = true;
    isFloorPlaneChecked: boolean = true;
    isModelBoxChecked: boolean = false;
    isPrinterBoxChecked: boolean = true;
    volumeData: VolumeData;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private http: HttpClient,
        private _fileManagementService: FileManagementService
    ) { }

    ngOnInit(): void {
        // console.log("Flags:: ", this.is);

    }

    onViewChange() {
        this.isView = !this.isView;
    }

    onFileChange(event: any) {
        this.files = event;
        this.loadModel(event);
    }

    ngOnChanges(changes: SimpleChanges): void {
        let shouldCallOnFileChange = false;

        if (changes?.degree?.currentValue) {
            this.degree = Number(changes?.degree?.currentValue);
            shouldCallOnFileChange = true;
        }

        if (changes?.files?.currentValue) {
            this.files = changes?.files?.currentValue;
            shouldCallOnFileChange = true;
        }

        if (changes?.printerSize?.currentValue) {
            this.isPrinterBoxChecked = true;
            this.isPrinterBoxVisible = true;
            this.printerSize = changes?.printerSize?.currentValue;
            shouldCallOnFileChange = true;
        }

        if (shouldCallOnFileChange) {
            this.onFileChange(this.files);
        }

        this._changeDetectorRef.detectChanges();
    }

    toggleRenderMode() {
        this.isRenderMode = !this.isRenderMode;
    }

    ngAfterViewInit() {
        this.initScene();
        this.animate();
        // setTimeout(() => {
        //     this.captureThumbnail();
        // }, 500);
        this._changeDetectorRef.detectChanges();
    }

    private initScene() {
        this.scene = new THREE.Scene();

        const aspectRatio = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
        this.camera.position.set(1, 2, 5);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });
        this.renderer.setSize(
            this.canvas.clientWidth,
            this.canvas.clientHeight
        );

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(5, 5, 5).normalize();
        this.scene.add(this.directionalLight);

        this.axisHelper = new THREE.AxesHelper(5);
        this.gridHelper = new THREE.GridHelper(10, 50);

        this.toggleAxis();
        this.toggleGrid();
        this.renderer.setClearColor(0xf1f5f9);
        this.renderer.render(this.scene, this.camera);
    }

    private animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }


    private loadModel(file: any) {
        if(!file?.url) return;
        const { url, name } = file;
        const loader = this.getLoader(name);

        if (loader) {
            this.http.get(url, { responseType: 'arraybuffer' }).subscribe(
                (response) => {
                    this.parseFile(loader, response, name);
                    this.getFileInformation(url);
                },
                (error) => {
                    console.error('Error loading model from URL:', error);
                }
            );
        }
    }

    private parseFile(loader: any, contents: ArrayBuffer, fileName: string) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const buffer = new Uint8Array(contents);

        if (loader instanceof STLLoader) {
            const geometry = loader.parse(contents);
            const material = this.createMaterial('solid');
            const mesh = new THREE.Mesh(geometry, material);
            this.addModelToScene(mesh);
        } else if (loader instanceof OBJLoader) {
            const textDecoder = new TextDecoder();
            const textContents = textDecoder.decode(buffer);
            const object = loader.parse(textContents);
            this.addModelToScene(object);
        } else if (loader instanceof GLTFLoader) {
            loader.parse(
                buffer.buffer,
                '',
                (gltf) => {
                    this.addModelToScene(gltf.scene);
                },
                (error) => {
                    console.error('Error parsing GLTF file:', error);
                }
            );
        } else if (loader instanceof VRMLLoader) {
            const textDecoder = new TextDecoder();
            const textContents = textDecoder.decode(buffer);
            const object = loader.parse(textContents, '');
            this.addModelToScene(object);
        }
    }

    private addModelToScene(object: THREE.Object3D) {
        if (this.model) this.scene.remove(this.model);
        this.model = object;

        this.model.rotation.x = THREE.MathUtils.degToRad(this.degree);

        // this.model.rotation.x = THREE.MathUtils.degToRad(270);
        this.scene.add(this.model);

        const box = new THREE.Box3().setFromObject(this.model);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Calculate the scale factor to fit the model within the grid and touch the X and Z axes
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scaleFactor = 1 / maxDimension; // Adjust 3 according to your grid size or preference

        // Scale down the model
        this.model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Position model so that the front-bottom-left corner is at origin (0, 0, 0)
        const modelPosition = new THREE.Vector3(
            -box.min.x * scaleFactor,
            -box.min.y * scaleFactor,
            -box.min.z * scaleFactor
        );
        this.model.position.copy(modelPosition);
        this.updatePrinterBox(scaleFactor, box);
        // this.togglePrinterBox();

        this.renderer.render(this.scene, this.camera);
        setTimeout(() => {
            this.captureThumbnail();
        }, 500);
    }

    private getLoader(fileName: string) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'stl':
                return new STLLoader();
            case 'obj':
                return new OBJLoader();
            case 'glb':
            case 'gltf':
                return new GLTFLoader();
            case 'wrl':
                return new VRMLLoader();
            default:
                throw new Error('Unsupported file format');
        }
    }

    public toggleGrid() {
        this.isGridVisible = !this.isGridVisible;
        if (this.isGridVisible) {
            this.gridHelper.material.color.setHex(0xdee0e0);
            this.gridHelper.material.opacity = 0.5;
            this.gridHelper.material.transparent = true;
            this.gridHelper.material.depthWrite = false;

            this.scene.add(this.gridHelper);
        } else {
            this.scene.remove(this.gridHelper!);
        }
        this.renderer.render(this.scene, this.camera);
    }

    public toggleAxis() {
        if (this.is3DAxesChecked) {
            this.scene.add(this.axisHelper!);
        } else {
            this.scene.remove(this.axisHelper!);
        }
        this.renderer.render(this.scene, this.camera);
    }

    onColorModeChange(event: any) {
        this.toggleColorMode();
    }

    public toggleColorMode() {
        this.isDarkMode = !this.isDarkMode;
        const material = this.createMaterial('solid');
        if (this.model) {
            this.model.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                    node.material = material;
                }
            });
        }
        this.renderer.setClearColor(this.isDarkMode ? 0x000000 : 0xf1f5f9); // Change canvas background color
        this.renderer.render(this.scene, this.camera);
    }



    public toggleModelBox() {
        this.isModelBoxVisible = !this.isModelBoxVisible;
        if (this.isModelBoxVisible) {
            const box = new THREE.Box3().setFromObject(this.model!);
            this.modelBoxHelper = new THREE.BoxHelper(this.model!, 0x949494); // box  color
            this.scene.add(this.modelBoxHelper);
        } else {
            this.scene.remove(this.modelBoxHelper!);
        }
        this.renderer.render(this.scene, this.camera);
    }

    private get canvas(): HTMLCanvasElement {
        return this.canvasRef.nativeElement;
    }

    private createMaterial(mode: string): THREE.Material {
        let material: THREE.Material;

        switch (mode) {
            case 'solid':
                material = new THREE.MeshStandardMaterial({
                    color: this.isDarkMode ? 0xf1f5f9 : 0xcccccc,
                });
                this.renderer.setClearColor(0xf1f5f9); // Set background to white
                break;
            case 'x-ray':
                material = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    opacity: 0.5,
                    transparent: true,
                });
                this.renderer.setClearColor(0x000000); // Set background to black
                break;
            case 'wireframe':
                material = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    wireframe: true,
                });
                this.renderer.setClearColor(0xf1f5f9); // Set background to white
                break;
            default:
                throw new Error('Unsupported mode');
        }

        return material;
    }

    onSelectionChange(event: any) {
        this.selectedOption = event.value;
        this.toggleDisplayMode(event.value);
    }

    public toggleDisplayMode(mode: string) {
        this.isDarkMode = false;

        if (this.model) {
            const material = this.createMaterial(mode);
            this.model.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                    node.material = material;
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    public captureThumbnail() {
        if (!this.model) {
            console.error('No model to capture thumbnail for.');
            return;
        }

        // Create a temporary scene and camera for the thumbnail
        const thumbnailScene = new THREE.Scene();
        const thumbnailCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

        // Clone the model and add it to the thumbnail scene
        const clonedModel = this.model.clone();
        thumbnailScene.add(clonedModel);

        // Calculate the bounding box of the model to adjust the camera
        const box = new THREE.Box3().setFromObject(clonedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = thumbnailCamera.fov * (Math.PI / 360);
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        // Set the desired camera angle and position
        thumbnailCamera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.5, cameraZ); // Adjust the position to get the desired angle
        thumbnailCamera.lookAt(center);

        // Create a temporary renderer for the thumbnail
        const thumbnailRenderer = new THREE.WebGLRenderer({ antialias: true });
        thumbnailRenderer.setSize(1000, 1000); // High-resolution thumbnail
        thumbnailRenderer.setClearColor(0xf1f5f9, 1); // White background

        // Render the model to the thumbnail renderer
        thumbnailRenderer.render(thumbnailScene, thumbnailCamera);

        // Extract the image data from the renderer
        const thumbnailCanvas = thumbnailRenderer.domElement;
        const thumbnailDataURL = thumbnailCanvas.toDataURL();

        // Display or store the thumbnail
        this.thumbnailSrc = thumbnailDataURL;
        this.thumbnail.emit(this.thumbnailSrc);
    }
    public toggleThinLines() {
        this.thinLinesVisible = !this.thinLinesVisible;

        if (this.model instanceof THREE.Mesh) {
            const linesName = 'edgesLines';
            let lines = this.model.getObjectByName(
                linesName
            ) as THREE.LineSegments;

            if (this.thinLinesVisible && !lines) {
                const linesMaterial = new THREE.LineBasicMaterial({
                    color: 0xff0000,
                }); // Red color for thin lines
                const linesGeometry = new THREE.EdgesGeometry(
                    this.model.geometry
                );
                lines = new THREE.LineSegments(linesGeometry, linesMaterial);
                lines.name = linesName; // Set a name for identification
                this.model.add(lines);
            } else if (!this.thinLinesVisible && lines) {
                this.model.remove(lines);
                if (lines.material) {
                    if (Array.isArray(lines.material)) {
                        lines.material.forEach((mat) => {
                            this.disposeMaterial(mat);
                        });
                    } else {
                        this.disposeMaterial(lines.material);
                    }
                }
                lines.geometry.dispose();
            }

            this.renderer.render(this.scene, this.camera);
        }
    }

    private disposeMaterial(material: THREE.Material) {
        if (material instanceof THREE.MeshStandardMaterial) {
            material.dispose();
            if (material.map) material.map.dispose(); // Dispose of associated textures if any
            if (material.normalMap) material.normalMap.dispose();
            // Dispose of other textures as needed
        } else if (
            material instanceof THREE.LineBasicMaterial ||
            material instanceof THREE.MeshBasicMaterial
        ) {
            material.dispose();
            if (material.map) material.map.dispose(); // Dispose of associated textures if any
            // Dispose of other textures as needed
        }
        // Handle disposal for other types of materials if necessary
    }

    onGuideSelectionChange(guide: string) {
        switch (guide) {
            case '3dAxes':
                this.toggleAxis();
                break;
            case 'floorPlane':
                this.toggleGrid();
                break;
            case 'modelBox':
                this.toggleModelBox();
                break;
            case 'printerBox':
                this.togglePrinterBox();
                break;
            case 'thinlines':
                this.toggleThinLines();
                break;
        }
    }

    private updatePrinterBox(scaleFactor: number, modelBox: THREE.Box3) {
        if (this.printerBox) {
            this.scene.remove(this.printerBox);
        }

        // Create the printer box geometry and material
        const geometry = new THREE.BoxGeometry(this.printerSize?.X, this.printerSize?.Y, this.printerSize?.Z);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        });

        this.printerBox = new THREE.Mesh(geometry, material);
        this.printerBox.rotation.x = THREE.MathUtils.degToRad(this.degree);

        // Calculate the bounding box of the printer box
        const printerBox = new THREE.Box3().setFromObject(this.printerBox);
        const size = new THREE.Vector3();
        printerBox.getSize(size);

        // Scale down the printer box
        this.printerBox.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Position the printer box so that its left-bottom corner is at origin (0, 0, 0)
        const printerBoxPosition = new THREE.Vector3(
            -printerBox.min.x * scaleFactor,
            -printerBox.min.y * scaleFactor,
            -printerBox.min.z * scaleFactor
        );
        this.printerBox.position.copy(printerBoxPosition);

        this.scene.add(this.printerBox);

    }

    public togglePrinterBox() {
        this.isPrinterBoxVisible = !this.isPrinterBoxVisible;
        if (this.isPrinterBoxVisible) {
            if (!this.printerBox) {
                this.updatePrinterBox(1, new THREE.Box3());
            }
            this.scene.add(this.printerBox!);
        } else {
            this.scene.remove(this.printerBox!);
        }
        this.renderer.render(this.scene, this.camera);
    }

    getFileInformation(fileUrl: string) {
        const name = fileUrl.split('/').pop()
        this._fileManagementService.getFileImformation(name).subscribe((response) => {
            this.volumeData = {
                volume: response.volume,
                coordinates: {
                    x: response.bounding_box[0],
                    y: response.bounding_box[1],
                    z: response.bounding_box[2]
                },
                surfaceArea: response.surface_area,
                errors: response.errors
            };
            this.onCoordinatePosition.emit(this.volumeData);
        });
    }

    convertMmToCm3(volumeInMm3: number): number {
        return +(volumeInMm3 / 1000).toFixed(2);
    }


}

export interface BoundingBoxCoordinates {
    x: number;
    y: number;
    z: number;
}

export interface VolumeData {
    volume: number;
    coordinates: BoundingBoxCoordinates;
    surfaceArea: number;
    errors: string[];
}
