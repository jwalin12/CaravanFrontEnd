import { Trans } from '@lingui/macro'
import Badge, { BadgeVariant } from 'components/Badge'
import { BigNumber } from 'ethers'
import { AlertCircle } from 'react-feather'
import styled from 'styled-components/macro'

import { MouseoverTooltip } from '../../components/Tooltip'

const BadgeWrapper = styled.div`
  font-size: 14px;
  display: flex;
  justify-content: flex-end;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`

const ActiveDot = styled.span`
  background-color: ${({ theme }) => theme.success};
  border-radius: 50%;
  height: 8px;
  width: 8px;
  margin-right: 4px;
`

export default function RentalBadge({
  renting,
  expiryDate
}: {
  renting: boolean | undefined
  expiryDate: BigNumber | undefined
}) {
  const isNotExpired = expiryDate && expiryDate.toNumber() >= Math.floor(Date.now() / 1000)
  return (
    <BadgeWrapper>
      {renting && isNotExpired ? (
        <MouseoverTooltip
          text={
            <Trans>
              You are currently renting this liquidity position.
            </Trans>
          }
        >
          <Badge variant={BadgeVariant.DEFAULT}>
            <ActiveDot /> &nbsp;
            <BadgeText>
              <Trans>Rental Active</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      ) : (
        <MouseoverTooltip
          text={
            <Trans>
              You are not currently renting this liquidity position. Your rental has likely expired.
            </Trans>
          }
        >
          <Badge variant={BadgeVariant.WARNING}>
            <AlertCircle width={14} height={14} />
            &nbsp;
            <BadgeText>
              <Trans>Rental Inactive</Trans>
            </BadgeText>
          </Badge>
        </MouseoverTooltip>
      )}
    </BadgeWrapper>
  )
}
