// @flow
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";

import type { StepProps } from "../types";

import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import ModeSelectorField from "../fields/ModeSelectorField";
import Text from "~/renderer/components/Text";

import DelegationSelectorField from "../fields/DelegationSelectorField";

export default function StepClaimRewards({
  account,
  parentAccount,
  onUpdateTransaction,
  transaction,
  status,
  bridgePending,
  t,
}: StepProps) {
  invariant(account && account.cosmosResources && transaction, "account and transaction required");
  const bridge = getAccountBridge(account, parentAccount);

  const unit = getAccountUnit(account);

  const updateClaimRewards = useCallback(
    newTransaction => {
      onUpdateTransaction(transaction => bridge.updateTransaction(transaction, newTransaction));
    },
    [bridge, onUpdateTransaction],
  );

  const onChangeMode = useCallback(
    mode => {
      updateClaimRewards({ ...transaction, mode });
    },
    [updateClaimRewards, transaction],
  );

  const selectedValidator = transaction.validators && transaction.validators[0];

  const amount =
    selectedValidator &&
    formatCurrencyUnit(unit, selectedValidator.amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    });

  const onDelegationChange = useCallback(
    ({ address, pendingRewards }) => {
      updateClaimRewards({ ...transaction, validators: [{ address, amount: pendingRewards }] });
    },
    [updateClaimRewards, transaction],
  );

  return (
    <Box flow={1}>
      <TrackPage category="ClaimRewards Flow" name="Step 1" />
      <ModeSelectorField mode={transaction.mode} onChange={onChangeMode} />
      {amount && (
        <Text fontSize={4} ff="Inter|Medium" textAlign="center">
          <Trans
            i18nKey="cosmos.claimRewards.flow.steps.claimRewards.compoundInfo"
            values={{ amount }}
          >
            <b></b>
          </Trans>
        </Text>
      )}

      <DelegationSelectorField
        transaction={transaction}
        account={account}
        t={t}
        onChange={onDelegationChange}
      />
    </Box>
  );
}

export function StepClaimRewardsFooter({
  transitionTo,
  account,
  parentAccount,
  onClose,
  status,
  bridgePending,
  transaction,
}: StepProps) {
  invariant(account, "account required");
  const { errors } = status;
  const hasErrors = Object.keys(errors).length;
  const canNext = !bridgePending && !hasErrors;

  // @TODO add in the support popover info
  return (
    <>
      <Box horizontal>
        <Button mr={1} secondary onClick={onClose}>
          <Trans i18nKey="common.cancel" />
        </Button>
        <Button disabled={!canNext} primary onClick={() => transitionTo("connectDevice")}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Box>
    </>
  );
}
