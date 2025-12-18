import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CameraControls from "camera-controls";

CameraControls.install({ THREE });

type ViewType = "streetView" | "tinyPlanet";

type ViewConfig = {
	distanceFromCenter: number;
	horizontalAngle: number;
	verticalAngle: number;
	zoomFactor: number;
	animated: boolean;
};

type MatchTinyWorldImgProps = {
	imageUrl: string;
	width?: number;
	height?: number;
	shouldAnimate?: boolean;
};

const views: Record<ViewType, ViewConfig> = {
	streetView: {
		distanceFromCenter: 0.01,
		horizontalAngle: 70,
		verticalAngle: 100,
		zoomFactor: 0.5,
		animated: true,
	},
	tinyPlanet: {
		distanceFromCenter: -500,
		horizontalAngle: 200,
		verticalAngle: 0,
		zoomFactor: 0.15,
		animated: true,
	},
};

const animationSpeed = 0.2;
const tinyPlanetSpinSpeed = 0.3;
const streetViewSpinSpeed = 0.05;

const rad = (deg: number): number => THREE.MathUtils.degToRad(deg);

export const MatchTinyWorldImg: React.FC<MatchTinyWorldImgProps> = ({
	imageUrl,
	width = 700,
	height = 400,
	shouldAnimate = true,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const cameraControlsRef = useRef<CameraControls | null>(null);
	const environmentSphereRef = useRef<THREE.Mesh | null>(null);
	const clockRef = useRef<THREE.Clock>(new THREE.Clock());
	const animationFrameRef = useRef<number | null>(null);
	const [currentView, setCurrentView] = useState<ViewType>("tinyPlanet");
	const currentViewRef = useRef<ViewType>("tinyPlanet");
	const shouldAnimateRef = useRef<boolean>(shouldAnimate);

	const createEnvironmentSphere = async (url: string): Promise<THREE.Mesh> => {
		const textureLoader = new THREE.TextureLoader();
		const environmentMap = await textureLoader.loadAsync(url);

		environmentMap.mapping = THREE.EquirectangularReflectionMapping;
		environmentMap.colorSpace = THREE.SRGBColorSpace;
		environmentMap.wrapS = THREE.RepeatWrapping;
		environmentMap.repeat.x = -1;

		const sphere = new THREE.Mesh(
			new THREE.SphereGeometry(500, 100, 50),
			new THREE.MeshBasicMaterial({
				map: environmentMap,
				side: THREE.BackSide,
			}),
		);

		return sphere;
	};

	const setView = (viewConfig: ViewConfig) => {
		if (!cameraControlsRef.current) {
			return;
		}

		cameraControlsRef.current.enabled = false;
		cameraControlsRef.current.setPosition(
			0,
			0,
			viewConfig.distanceFromCenter,
			viewConfig.animated,
		);
		cameraControlsRef.current.rotateTo(
			rad(viewConfig.horizontalAngle),
			rad(viewConfig.verticalAngle),
			viewConfig.animated,
		);
		cameraControlsRef.current.zoomTo(
			viewConfig.zoomFactor,
			viewConfig.animated,
		);
	};

	const render = () => {
		if (
			!rendererRef.current ||
			!cameraRef.current ||
			!cameraControlsRef.current ||
			!sceneRef.current
		) {
			return;
		}

		const delta = clockRef.current.getDelta();
		let needsRender = cameraControlsRef.current.update(delta * animationSpeed);

		if (environmentSphereRef.current && shouldAnimateRef.current) {
			const targetSpeed =
				currentViewRef.current === "tinyPlanet"
					? tinyPlanetSpinSpeed
					: streetViewSpinSpeed;
			environmentSphereRef.current.rotation.y += delta * targetSpeed;
			needsRender = true;
		}

		if (needsRender) {
			rendererRef.current.render(sceneRef.current, cameraRef.current);
		}

		if (shouldAnimateRef.current) {
			animationFrameRef.current = requestAnimationFrame(render);
		} else {
			animationFrameRef.current = null;
		}
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		let isMounted = true;

		const initScene = async () => {
			// Create environment sphere
			const environmentSphere = await createEnvironmentSphere(imageUrl);
			if (!isMounted) {
				return;
			}

			environmentSphereRef.current = environmentSphere;

			// Create scene
			const scene = new THREE.Scene();
			scene.add(environmentSphere);
			sceneRef.current = scene;

			// Create renderer
			const renderer = new THREE.WebGLRenderer({
				antialias: true,
				canvas,
			});
			renderer.outputColorSpace = THREE.SRGBColorSpace;
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(width, height);
			rendererRef.current = renderer;

			// Create camera
			const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 2000);
			cameraRef.current = camera;

			// Create camera controls
			const cameraControls = new CameraControls(camera, canvas);
			cameraControls.restThreshold = 1;
			cameraControls.addEventListener("rest", () => {
				cameraControls.enabled = true;
			});
			cameraControlsRef.current = cameraControls;

			// Set initial view
			setView({ ...views.tinyPlanet, animated: false });

			// Start animation loop
			if (shouldAnimateRef.current) {
				render();
			} else {
				renderer.render(scene, camera);
			}
		};

		initScene();

		// eslint-disable-next-line consistent-return
		return () => {
			isMounted = false;

			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}

			if (cameraControlsRef.current) {
				cameraControlsRef.current.dispose();
			}

			if (rendererRef.current) {
				rendererRef.current.dispose();
			}

			if (environmentSphereRef.current) {
				const material = environmentSphereRef.current
					.material as THREE.MeshBasicMaterial;
				if (material.map) {
					material.map.dispose();
				}
				material.dispose();
				environmentSphereRef.current.geometry.dispose();
			}

			if (sceneRef.current) {
				sceneRef.current.clear();
			}
		};
	}, [imageUrl, width, height]);

	useEffect(() => {
		currentViewRef.current = currentView;
		if (cameraControlsRef.current) {
			setView(views[currentView]);
		}
	}, [currentView]);

	useEffect(() => {
		shouldAnimateRef.current = shouldAnimate;
		if (shouldAnimate && !animationFrameRef.current) {
			clockRef.current.start();
			render();
		}

		if (!shouldAnimate && animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
	}, [shouldAnimate]);

	return (
		<div className="relative w-full h-full">
			<canvas ref={canvasRef} className="w-full h-full" />
			<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
				<button
					type="button"
					onClick={() => setCurrentView("streetView")}
					disabled={currentView === "streetView"}
					className={`px-4 py-2 rounded-sm ${
						currentView === "streetView"
							? "bg-gray-300"
							: "bg-platte-yellow-400 hover:bg-platte-yellow-600"
					}`}
				>
					Street View
				</button>
				<button
					type="button"
					onClick={() => setCurrentView("tinyPlanet")}
					disabled={currentView === "tinyPlanet"}
					className={`px-4 py-2 rounded-sm ${
						currentView === "tinyPlanet"
							? "bg-gray-300"
							: "bg-platte-yellow-400 hover:bg-platte-yellow-600"
					}`}
				>
					Tiny Planet
				</button>
			</div>
		</div>
	);
};
