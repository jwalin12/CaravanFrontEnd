import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Position } from '@uniswap/v3-sdk'
import { AutoColumn } from 'components/Column'
import { PositionPreview } from 'components/PositionPreview'
import { RentalPreview } from 'components/RentalPreview'
import styled from 'styled-components/macro'

import { Bound, Field } from '../../state/mint/v3/actions'

const Wrapper = styled.div`
  padding-top: 12px;
`

export function Review({
  position,
  outOfRange,
  ticksAtLimit,
  rentalDurationSecs,
  rentalPriceInEth
}: {
  rentalDurationSecs?: number
  rentalPriceInEth?: string
  position?: Position
  existingPosition?: Position
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> }
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  outOfRange: boolean
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
}) {
  return (
    <Wrapper>
      <AutoColumn gap="lg">
        {position ? rentalDurationSecs ? (
          <RentalPreview
              position={position}
              inRange={!outOfRange}
              ticksAtLimit={ticksAtLimit}
              title={'Selected Range'}
              rentalDurationSecs={rentalDurationSecs}
              rentalPriceInEth={rentalPriceInEth}
            />
        ) : 
          (
            <PositionPreview
              position={position}
              inRange={!outOfRange}
              ticksAtLimit={ticksAtLimit}
              title={'Selected Range'}
            />
          )
         : null}
      </AutoColumn>
    </Wrapper>
  )
}
