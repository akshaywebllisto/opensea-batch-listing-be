'use strict';
import 'dotenv/config';
import axios from 'axios';
import db from '../../model';

const { USER_OPENSEA_ASSETS_API, USER_OPENSEA_EVENTS_API, NFT_LISTED_API } = process.env;

export const AssetsApi = async (owner_address, offset, limit) => {
  try {
    // fetching data from opensea
    const response = await axios.get(
      `${USER_OPENSEA_ASSETS_API}?owner=${owner_address}&order_direction=desc&offset=${offset}&limit=${limit}&include_orders=false`
    );

    if (response == null) throw new Error('Assets data not get from opensea');
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const EventsApi = async (owner_address, limit) => {
  try {
    // fetching data from opensea
    const responseEvents = await axios.get(
      `${USER_OPENSEA_EVENTS_API}?account_address=${owner_address}&event_type=successful&only_opensea=false&limit=${limit}`
    );
    if (responseEvents == null) throw new Error('Event data not get from opensea');

    await responseEvents.data.asset_events.map(async (item) => {
      try {
        //old
        const oldContractAddress = await db.asset_contract.findOne({
          where: {
            address: item?.asset?.asset_contract?.address,
          },
        });
        const oldTokenId = await db.asset_events.findOne({
          where: {
            owner_address: owner_address,
            token_id: item?.asset?.token_id,
          },
        });

        if (!oldTokenId && !oldContractAddress) {
          // creating new owner
          const newEvent = await db.asset_events.create({
            owner_address: owner_address,
            permalink: item?.asset?.permalink,
            token_id: item?.asset?.token_id,
            total_price: item?.total_price,
            transaction_block_hash: item?.transaction?.block_hash,
            transaction_block_number: item?.transaction?.block_number,
          });

          const newAssets = await db.assets.create({
            owner_address: owner_address,
            assetEventId: newEvent.id,
            assets_id: item?.asset?.id,
            name: item?.asset?.name,
            description: item?.asset?.description,
            image_url: item?.asset?.image_url,
            image_preview_url: item?.asset?.image_preview_url,
            image_thumbnail_url: item?.asset?.image_thumbnail_url,
            image_original_url: item?.asset?.image_original_url,
          });

          await db.asset_contract.create({
            assetId: newAssets.id,
            address: item?.asset?.asset_contract?.address,
            created_date: item?.asset?.asset_contract?.created_date,
            name: item?.asset?.asset_contract?.name,
            schema_name: item?.asset?.asset_contract?.schema_name,
            description: item?.asset?.asset_contract?.description,
            external_link: item?.asset?.asset_contract?.external_link,
            image_url: item?.asset?.asset_contract?.image_url,
            payout_address: item?.asset?.asset_contract?.payout_address,
            seller_fee_basis_points: item?.asset?.asset_contract?.seller_fee_basis_points,
            opensea_seller_fee_basis_points: item?.asset?.asset_contract?.opensea_seller_fee_basis_points,
          });

          await db.collection.create({
            assetId: newAssets.id,
            banner_image_url: item?.asset?.collection?.banner_image_url,
            created_date: item?.asset?.collection?.created_date,
            description: item?.asset?.collection?.description,
            slug: item?.asset?.collection?.slug,
            name: item?.asset?.collection.name,
          });

          await db.seller.create({
            assetEventId: newEvent.id,
            address: item?.seller?.address,
            profile_img_url: item?.seller?.profile_img_url,
          });

          await db.winner_account.create({
            assetEventId: newEvent.id,
            address: item?.winner_account?.address,
            profile_img_url: item?.winner_account?.profile_img_url,
          });
        }
      } catch (error) {
        throw new Error(error.message);
      }
    });

    return responseEvents;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const isOnListApi = async (asset_contract_address, token_id) => {
  // fetching data from opensea
  try {
    const isListed = await axios.get(`${NFT_LISTED_API}/${asset_contract_address}/${token_id}`);
    if (isListed == null) throw new Error('data not get from opensea');
    return isListed;
  } catch (error) {
    throw new Error(error.message);
  }
};
