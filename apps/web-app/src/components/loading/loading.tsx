import { i18n } from "../../i18n/i18n-utils";
import { StartLayout } from "../start/start-layout";

export const Loading = () => {
	return (
		<StartLayout isLoading={true} animateDecorations={true}>
			<h1 className="text-3xl 2xl:text-4xl font-semibold tracking-wide max-w-sm">
				{i18n("loading.title")}
			</h1>
		</StartLayout>
	);
};
