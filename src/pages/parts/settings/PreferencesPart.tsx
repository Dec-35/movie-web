import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { getProviders } from "@/backend/providers/providers";
import { Toggle } from "@/components/buttons/Toggle";
import { FlagIcon } from "@/components/FlagIcon";
import { Dropdown } from "@/components/form/Dropdown";
import { SortableList } from "@/components/form/SortableList";
import { Heading1 } from "@/components/utils/Text";
import { appLanguageOptions } from "@/setup/i18n";
import { isAutoplayAllowed } from "@/utils/autoplay";
import { getLocaleInfo, sortLangCodes } from "@/utils/language";

export function PreferencesPart(props: {
  language: string;
  setLanguage: (l: string) => void;
  enableThumbnails: boolean;
  setEnableThumbnails: (v: boolean) => void;
  enableAutoplay: boolean;
  setEnableAutoplay: (v: boolean) => void;
  sourceOrder: string[];
  setSourceOrder: (v: string[]) => void;
}) {
  const { t } = useTranslation();
  const sorted = sortLangCodes(appLanguageOptions.map((item) => item.code));

  const allowAutoplay = isAutoplayAllowed();

  const options = appLanguageOptions
    .sort((a, b) => sorted.indexOf(a.code) - sorted.indexOf(b.code))
    .map((opt) => ({
      id: opt.code,
      name: `${opt.name}${opt.nativeName ? ` — ${opt.nativeName}` : ""}`,
      leftIcon: <FlagIcon langCode={opt.code} />,
    }));

  const selected = options.find(
    (item) => item.id === getLocaleInfo(props.language)?.code,
  );

  return (
    <div className="space-y-12">
      <Heading1 border>{t("settings.preferences.title")}</Heading1>
      <div>
        <p className="text-white font-bold mb-3">
          {t("settings.preferences.language")}
        </p>
        <p className="max-w-[20rem] font-medium">
          {t("settings.preferences.languageDescription")}
        </p>
        <Dropdown
          options={options}
          selectedItem={selected || options[0]}
          setSelectedItem={(opt) => props.setLanguage(opt.id)}
        />
      </div>

      <div>
        <p className="text-white font-bold mb-3">
          {t("settings.preferences.thumbnail")}
        </p>
        <p className="max-w-[25rem] font-medium">
          {t("settings.preferences.thumbnailDescription")}
        </p>
        <div
          onClick={() => props.setEnableThumbnails(!props.enableThumbnails)}
          className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg"
        >
          <Toggle enabled={props.enableThumbnails} />
          <p className="flex-1 text-white font-bold">
            {t("settings.preferences.thumbnailLabel")}
          </p>
        </div>
      </div>
      <div>
        <p className="text-white font-bold mb-3">
          {t("settings.preferences.autoplay")}
        </p>
        <p className="max-w-[25rem] font-medium">
          {t("settings.preferences.autoplayDescription")}
        </p>
        <div
          onClick={() =>
            allowAutoplay
              ? props.setEnableAutoplay(!props.enableAutoplay)
              : null
          }
          className={classNames(
            "bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg",
            allowAutoplay
              ? "cursor-pointer opacity-100 pointer-events-auto"
              : "cursor-not-allowed opacity-50 pointer-events-none",
          )}
        >
          <Toggle enabled={props.enableAutoplay && allowAutoplay} />
          <p className="flex-1 text-white font-bold">
            {t("settings.preferences.autoplayLabel")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-white font-bold">
          {t("settings.preferences.sourceOrder")}
        </p>
        <p className="max-w-[25rem] font-medium">
          {t("settings.preferences.sourceOrderDescription")}
        </p>

        <SortableList
          items={props.sourceOrder.map((id) => ({
            id,
            name:
              getProviders()
                .listSources()
                .find((s) => s.id === id)?.name || id,
          }))}
          setItems={(items) =>
            props.setSourceOrder(items.map((item) => item.id))
          }
        />
      </div>
    </div>
  );
}
