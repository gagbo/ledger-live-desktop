// @flow
import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import type { ListAppsResult } from "@ledgerhq/live-common/lib/apps/types";
import { distribute, initState } from "@ledgerhq/live-common/lib/apps/logic";
import type { Device } from "~/renderer/reducers/devices";
import AppsList from "./AppsList";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { command } from "~/renderer/commands";
import FirmwareUpdate from "./FirmwareUpdate";
import { getCurrentDevice } from "~/renderer/reducers/devices";

type Props = {
  device: Device,
  deviceInfo: DeviceInfo,
  result: ?ListAppsResult,
  onReset: () => void,
};

const Dashboard = ({ device, deviceInfo, result, onReset }: Props) => {
  const { t } = useTranslation();
  const currentDevice = useSelector(getCurrentDevice);
  const [firmwareUpdateOpened, setFirmwareUpdateOpened] = useState(false);
  const hasDisconnectedDuringFU = useRef(false);

  // on disconnect, go back to connect
  useEffect(() => {
    // if there is no device but firmware update still happening
    if (!currentDevice && firmwareUpdateOpened) {
      hasDisconnectedDuringFU.current = true; // set disconnected to true for a later onReset()
    }

    // we must not reset during firmware update
    if (firmwareUpdateOpened) {
      return;
    }

    // we need to reset only if device is unplugged OR a disconnection happened during firmware update
    if (!currentDevice || hasDisconnectedDuringFU.current) {
      onReset();
    }
  }, [onReset, firmwareUpdateOpened, currentDevice]);

  const exec = useCallback(
    (appOp, targetId, app) =>
      command("appOpExec")({ appOp, targetId, app, devicePath: device.path }),
    [device],
  );

  const appsStoragePercentage = useMemo(() => {
    if (!result) return 0;
    const d = distribute(initState(result));
    return d.totalAppsBytes / d.appsSpaceBytes;
  }, [result]);

  return (
    <Box flow={4} selectable>
      <TrackPage
        category="Manager"
        name="Dashboard"
        deviceModelId={device.modelId}
        deviceVersion={deviceInfo.version}
        appsStoragePercentage={appsStoragePercentage}
        appLength={result ? result.installed.length : 0}
      />
      {result ? (
        <AppsList
          device={device}
          deviceInfo={deviceInfo}
          result={result}
          exec={exec}
          render={disableFirmwareUpdate => (
            <FirmwareUpdate
              t={t}
              device={device}
              deviceInfo={deviceInfo}
              setFirmwareUpdateOpened={setFirmwareUpdateOpened}
              disableFirmwareUpdate={disableFirmwareUpdate}
            />
          )}
        />
      ) : (
        <FirmwareUpdate
          t={t}
          device={device}
          deviceInfo={deviceInfo}
          setFirmwareUpdateOpened={setFirmwareUpdateOpened}
        />
      )}
    </Box>
  );
};

export default Dashboard;
