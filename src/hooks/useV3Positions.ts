import { BigNumber, BigNumberish } from 'ethers'
import { useMemo } from 'react'
import { CallStateResult, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { PositionDetails } from 'types/position'

import { useCaravanRentalEscrowContract, useCaravanRentRouterContract, useV3NFTPositionManagerContract } from './useContract'

interface UseV3PositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
}

function useV3PositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()
  const inputs = useMemo(() => (tokenIds ? tokenIds.map((tokenId) => [BigNumber.from(tokenId)]) : []), [tokenIds])
  const results = useSingleContractMultipleData(positionManager, 'positions', inputs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results.map((call, i) => {
        const tokenId = tokenIds[i]
        const result = call.result as CallStateResult
        return {
          tokenId,
          fee: result.fee,
          feeGrowthInside0LastX128: result.feeGrowthInside0LastX128,
          feeGrowthInside1LastX128: result.feeGrowthInside1LastX128,
          liquidity: result.liquidity,
          nonce: result.nonce,
          operator: result.operator,
          tickLower: result.tickLower,
          tickUpper: result.tickUpper,
          token0: result.token0,
          token1: result.token1,
          tokensOwed0: result.tokensOwed0,
          tokensOwed1: result.tokensOwed1,
        }
      })
    }
    return undefined
  }, [loading, error, results, tokenIds])

  return {
    loading,
    positions: positions?.map((position, i) => ({ ...position, tokenId: inputs[i][0] })),
  }
}

interface UseV3PositionResults {
  loading: boolean
  position: PositionDetails | undefined
}

export function useV3PositionFromTokenId(tokenId: BigNumber | undefined): UseV3PositionResults {
  const position = useV3PositionsFromTokenIds(tokenId ? [tokenId] : undefined)
  return {
    loading: position.loading,
    position: position.positions?.[0],
  }
}

interface RentInfo {
  expiryDate: BigNumber
  originalOwner: string
  renter: string
  tokenId: BigNumber
  uniswapPoolAddress: string
}

export function useCaravanRentalPositions(account: string | null | undefined): UseV3PositionsResults {
  const router = useCaravanRentRouterContract()
  const rentalEscrow = useCaravanRentalEscrowContract()

  const { loading: rentalIdsLoading, result: rentalIdResults } = useSingleCallResult(router, 'getRentalsInProgress')
  const allRentalIds: (number[] | undefined)[] = rentalIdResults?.[0].map((el: BigNumber) => [el.toNumber()]) ?? [undefined]
  const rentInfoResults = useSingleContractMultipleData(rentalEscrow, 'tokenIdToRentInfo', allRentalIds)
  // TODO: filter rentInfoResults to only keep those that have renter == account
  // TODO: map filtered rentInfoResults to tokenId[] and return useV3PositionsFromTokenIds(tokenIds) 

  const someTokenIdsLoading = useMemo(() => rentInfoResults.some(({ loading }) => loading), [rentInfoResults])

  const filteredRentInfo = useMemo(() => {
    if (account) {
      return rentInfoResults
        .map(({ result }) => result)
        .filter((result): result is CallStateResult => !!result)
        .map((result) => {
          return {
            expiryDate: result.expiryDate,
            originalOwner: result.originalOwner,
            renter: result.renter,
            tokenId: result.tokenId,
            uniswapPoolAddress: result.uniswapPoolAddress
          } as RentInfo
        })
        .filter((result) => result.renter === account)
    }
    return []
  }, [account, rentInfoResults])

  const filteredTokenIds = useMemo(() => filteredRentInfo.map((result) => result.tokenId), [filteredRentInfo])

  console.log({filteredRentInfo, filteredTokenIds, account})
  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(filteredTokenIds)

  return {
    loading: someTokenIdsLoading || rentalIdsLoading || positionsLoading,
    positions,
  }
}

export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()

  const { loading: balanceLoading, result: balanceResult } = useSingleCallResult(positionManager, 'balanceOf', [
    account ?? undefined,
  ])

  // we don't expect any account balance to ever exceed the bounds of max safe int
  const accountBalance: number | undefined = balanceResult?.[0]?.toNumber()

  const tokenIdsArgs = useMemo(() => {
    if (accountBalance && account) {
      const tokenRequests = []
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push([account, i])
      }
      return tokenRequests
    }
    return []
  }, [account, accountBalance])

  const tokenIdResults = useSingleContractMultipleData(positionManager, 'tokenOfOwnerByIndex', tokenIdsArgs)
  const someTokenIdsLoading = useMemo(() => tokenIdResults.some(({ loading }) => loading), [tokenIdResults])

  const tokenIds = useMemo(() => {
    if (account) {
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is CallStateResult => !!result)
        .map((result) => BigNumber.from(result[0]))
    }
    return []
  }, [account, tokenIdResults])

  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(tokenIds)

  return {
    loading: someTokenIdsLoading || balanceLoading || positionsLoading,
    positions,
  }
}
