import { i18n } from "../../i18n/i18n-utils";

export const Loading = () => {
	return (
		<div>
			<h1 className="text-3xl font-bold">{i18n("loading.title")}</h1>
			<p className="text-2xl py-2">{i18n("loading.trafficMixAnalyzing")}</p>
		</div>
	);
};
