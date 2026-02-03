import { i18n } from "../../i18n/i18n-utils";
import { StartLayout } from "../start/start-layout";

export const Loading = () => {
	return (
		<StartLayout isLoading={true} animateDecorations={true}>
			<h1 className="font-pixel text-5xl 2xl:text-6xl font-semibold tracking-wide">
				{i18n("loading.title")}
			</h1>
			<p className="text-lg 2xl:text-xl text-white/80">
				{i18n("loading.trafficMixAnalyzing")}
			</p>
		</StartLayout>
	);
};
