import { i18n } from "../../i18n/i18n-utils";
import { StartLayout } from "../start/start-layout";

export const Loading = () => {
	return (
		<StartLayout isLoading={true} animateDecorations={true}>
			<h1 className="text-5xl 2xl:text-6xl font-semibold tracking-wide">
				<span className="whitespace-nowrap">{i18n("loading.title.line1")}</span>
				<br />
				{i18n("loading.title.line2")}
			</h1>
		</StartLayout>
	);
};
