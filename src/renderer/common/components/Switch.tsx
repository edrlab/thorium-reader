import {
  SwitchField,
  SwitchButton,
  type SwitchFieldProps,
} from "react-aria-components/Switch";
import * as stylesSwitch from "readium-desktop/renderer/assets/styles/components/switch.scss";
import * as React from "react";

export interface SwitchProps extends Omit<SwitchFieldProps, "children"> {
  children: React.ReactNode;
}

export function Switch({children,...props}: SwitchProps) {
  return (
    <SwitchField className={stylesSwitch.switchField} {...props}>
      <SwitchButton className={stylesSwitch.switchButton}>
        {() => (
          <>
            <div className={stylesSwitch.track}>
              <div className={stylesSwitch.handle} />
            </div>
            {children}
          </>
        )}
      </SwitchButton>
    </SwitchField>
  );
}
