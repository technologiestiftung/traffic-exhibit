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
	transitionToStreetViewTrigger?: number;
	loaderAccentColor?: string;
};

const views: Record<ViewType, ViewConfig> = {
	streetView: {
		distanceFromCenter: 0.01,
		horizontalAngle: 70,
		verticalAngle: 100,
		zoomFactor: 0.325,
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

const animationSpeed = 0.12;
const tinyPlanetSpinSpeed = 0.2;
const streetViewSpinSpeed = 0.12;

// Controls how long it takes to interpolate between the tiny-planet and street-view
// camera states (position/rotation/zoom). Higher = slower transitions.
const viewTransitionSeconds = 10;

const rad = (deg: number): number => THREE.MathUtils.degToRad(deg);

export const MatchTinyWorldImg: React.FC<MatchTinyWorldImgProps> = ({
	imageUrl,
	width = 600,
	height = 600,
	shouldAnimate = true,
	transitionToStreetViewTrigger,
	loaderAccentColor,
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
	const [autoTransitionResetKey, setAutoTransitionResetKey] = useState(0);
	const [sceneReady, setSceneReady] = useState(false);
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
		setSceneReady(false);

		const initScene = async () => {
			try {
				const environmentSphere = await createEnvironmentSphere(imageUrl);
				if (!isMounted) {
					return;
				}

				environmentSphereRef.current = environmentSphere;

				const scene = new THREE.Scene();
				scene.add(environmentSphere);
				sceneRef.current = scene;

				const renderer = new THREE.WebGLRenderer({
					antialias: true,
					canvas,
				});
				renderer.outputColorSpace = THREE.SRGBColorSpace;
				renderer.setPixelRatio(window.devicePixelRatio);
				renderer.setSize(width, height);
				rendererRef.current = renderer;

				const camera = new THREE.PerspectiveCamera(
					45,
					width / height,
					0.2,
					2000,
				);
				cameraRef.current = camera;

				const cameraControls = new CameraControls(camera, canvas);
				cameraControls.restThreshold = 1;
				cameraControls.addEventListener("rest", () => {
					cameraControls.enabled = true;
				});
				cameraControlsRef.current = cameraControls;

				setView({ ...views.tinyPlanet, animated: false });

				if (shouldAnimateRef.current) {
					render();
				} else {
					renderer.render(scene, camera);
				}

				if (isMounted) {
					setSceneReady(true);
				}
			} catch {
				if (isMounted) {
					setSceneReady(true);
				}
			}
		};

		initScene();

		// eslint-disable-next-line consistent-return
		return () => {
			isMounted = false;
			setSceneReady(false);

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

	// When hardware button (SW) triggers, toggle between tiny planet and street view
	useEffect(() => {
		if (
			typeof transitionToStreetViewTrigger === "number" &&
			transitionToStreetViewTrigger > 0
		) {
			setCurrentView((prev) =>
				prev === "tinyPlanet" ? "streetView" : "tinyPlanet",
			);
			// Reset the auto-transition countdown so we don't immediately toggle again.
			setAutoTransitionResetKey((k) => k + 1);
		}
	}, [transitionToStreetViewTrigger]);

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

	// Auto-toggle tiny planet ↔ street view; reset timer when selection button is pressed
	useEffect(() => {
		if (!shouldAnimate) {
			return undefined;
		}
		const timeoutId = window.setTimeout(() => {
			setCurrentView((prev) =>
				prev === "tinyPlanet" ? "streetView" : "tinyPlanet",
			);
		}, viewTransitionSeconds * 1000);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [shouldAnimate, autoTransitionResetKey, currentView]);

	return (
		<div className="relative h-full min-h-0 w-full">
			{!sceneReady && (
				<div className="absolute inset-0 z-[1] grid place-items-center bg-gradient-to-br from-neutral-500/35 via-neutral-400/25 to-neutral-600/30">
					<div className="flex flex-col items-center gap-3 rounded-md">
						<span
							aria-hidden
							className="h-16 w-16 animate-spin rounded-full border-[3px] border-white/25"
							style={{
								borderTopColor: loaderAccentColor ?? "rgba(255,255,255,0.95)",
							}}
						/>
					</div>
				</div>
			)}
			<div className="relative z-[2] h-full w-full overflow-hidden">
				<canvas
					ref={canvasRef}
					className={`h-full w-full transition-opacity duration-500 ease-out ${sceneReady ? "opacity-100" : "opacity-0"} ${!shouldAnimate && "blur-xs"}`}
				/>
			</div>
		</div>
	);
};
