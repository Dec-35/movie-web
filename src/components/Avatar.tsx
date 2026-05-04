import classNames from "classnames";
import { useMemo, useState } from "react";

import { base64ToBuffer, decryptData } from "@/backend/accounts/crypto";
import { Icon, Icons } from "@/components/Icon";
import { UserIcon } from "@/components/UserIcon";
import { AccountProfile } from "@/pages/parts/auth/AccountCreatePart";
import { useAuthStore } from "@/stores/auth";

export interface AvatarProps {
  profile: AccountProfile["profile"];
  sizeClass?: string;
  iconClass?: string;
  bottom?: React.ReactNode;
}

export function Avatar(props: AvatarProps) {
  return (
    <div className="relative inline-block">
      <div
        className={classNames(
          props.sizeClass,
          "rounded-full overflow-hidden flex items-center justify-center text-white",
        )}
        style={{
          background: `linear-gradient(to bottom right, ${props.profile.colorA}, ${props.profile.colorB})`,
        }}
      >
        <UserIcon
          className={props.iconClass}
          icon={props.profile.icon as any}
        />
      </div>
      {props.bottom ? (
        <div className="absolute bottom-0 left-1/2 transform translate-y-1/2 -translate-x-1/2">
          {props.bottom}
        </div>
      ) : null}
    </div>
  );
}

export function AccountAvatar(props: {
  username?: string;
  iconImage?: string;
  deletable: boolean;
  delete(): Promise<void>;
  selected?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  const editOverlay = (
    <div className="close-button" onClick={props.delete}>
      <Icon className="flex justify-center text-white" icon={Icons.X} />
    </div>
  );

  return props.iconImage && !imageError ? (
    <div className="flex-column avatar-container relative">
      <div className="rounded-full account-avatar w-[1.5rem] h-[1.5rem] ssm:w-[2rem] ssm:h-[2rem]">
        <img
          src={props.iconImage}
          onError={() => setImageError(true)}
          alt={`${props.username}'s avatar`}
          className="rounded-full "
        />
        <p className={`username${props.selected ? " text-white" : ""}`}>
          {props.username}
        </p>
        {props.deletable ? editOverlay : null}
      </div>
    </div>
  ) : (
    <div className="flex-column avatar-container relative">
      <div className="relative inline-block">
        <div className="account-avatar w-[1.5rem] h-[1.5rem] ssm:w-[2rem] ssm:h-[2rem] rounded-full bg-type-dimmed flex items-center justify-center">
          <Icon icon={Icons.USER} className="text-white ssm:text-xl" />
          <p className={`username${props.selected ? " text-white" : ""}`}>
            {props.username}
          </p>
          {props.deletable ? editOverlay : null}
        </div>
      </div>
    </div>
  );
}

export function UserAvatar(props: {
  sizeClass?: string;
  iconClass?: string;
  bottom?: React.ReactNode;
  withName?: boolean;
}) {
  const auth = useAuthStore();

  const bufferSeed = useMemo(
    () =>
      auth.account && auth.account.seed
        ? base64ToBuffer(auth.account.seed)
        : null,
    [auth],
  );

  if (!auth.account || auth.account === null) return null;

  const deviceName = bufferSeed
    ? decryptData(auth.account.deviceName, bufferSeed)
    : "...";

  return (
    <>
      <Avatar
        profile={auth.account.profile}
        sizeClass={
          props.sizeClass ?? "w-[1.5rem] h-[1.5rem] ssm:w-[2rem] ssm:h-[2rem]"
        }
        iconClass={props.iconClass}
        bottom={props.bottom}
      />
      {props.withName && bufferSeed ? (
        <span className="hidden md:inline-block">
          {deviceName.length >= 20
            ? `${deviceName.slice(0, 20 - 1)}…`
            : deviceName}
        </span>
      ) : null}
    </>
  );
}

export function NoUserAvatar(props: { iconClass?: string }) {
  return (
    <div className="relative inline-block p-1 text-type-dimmed">
      <Icon
        className={props.iconClass ?? "text-base ssm:text-xl"}
        icon={Icons.MENU}
      />
    </div>
  );
}
