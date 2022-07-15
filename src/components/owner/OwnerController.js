'use strict';
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { Op } from 'sequelize';
import db from '../../model/index';
import GlobalController from '../../utils/GlobalController';
import { AssetsApi, EventsApi, isOnListApi } from './opensea';

export default {
  generateNonce: async (req, res, next) => {
    const { owner_address } = req.body;
    if (!owner_address) return res.status(400).send('please provide a wallet address');
    try {
      return res.status(200).json({ message: 'Random Nonce', owner_address, nonce: uuidv4() });
    } catch (error) {
      next(error);
    }
  },

  generateTokenAndLogin: async (req, res, next) => {
    const { owner_address, nonce, offset = 0, limit = 200 } = req.body;
    if (!nonce || !owner_address) return res.status(400).send('Please, Provide Wallet Address and Nonce');
    try {
      // generating token
      const token = GlobalController.GenerateJWTToken(owner_address, nonce);

      // fetching data from opensea
      const responsed = await AssetsApi(owner_address, offset, limit);
      if (responsed == null) return res.status(400).json({ mesage: 'data not get from opensea' });

      let totalPrice = 0;
      await responsed.data.assets.map(async (item) => {
        try {
          // checking old nft
          const oldNFT = await db.nft.findOne({
            where: {
              owner_address: owner_address,
              token_id: item?.token_id,
            },
          });

          const oldAssetContractAddress = await db.asset_contract.findOne({
            where: {
              address: item?.asset_contract?.address,
            },
          });

          if (!oldNFT && !oldAssetContractAddress) {
            // creating new owner
            const newNFT = await db.nft.create({
              owner_address: owner_address,
              nft_id: item?.id,
              image_url: item?.image_url,
              image_preview_url: item?.image_preview_url,
              image_thumbnail_url: item?.image_preview_url,
              image_original_url: item?.image_preview_url,
              name: item?.name,
              description: item?.description,
              permalink: item?.permalink,
              token_id: item?.token_id,
            });
            if (newNFT == null) return res.status(400).send('Owner Not Created yet!!');

            // calculatting totalPrice
            if (item?.last_sale != null && item?.last_sale !== undefined) {
              totalPrice = totalPrice + parseFloat(item?.last_sale?.total_price / 10 ** 18);
            }

            await db.owner.create({
              nftId: newNFT.id,
              address: owner_address,
              profile_img_url: item?.owner.profile_img_url,
            });

            await db.creator.create({
              nftId: newNFT.id,
              address: item?.creator?.address,
              profile_img_url: item?.creator?.profile_img_url,
            });

            await db.asset_contract.create({
              nftId: newNFT.id,
              address: item?.asset_contract?.address,
              created_date: item?.asset_contract?.created_date,
              name: item?.asset_contract?.name,
              schema_name: item?.asset_contract?.schema_name,
              description: item?.asset_contract?.description,
              external_link: item?.asset_contract?.external_link,
              image_url: item?.asset_contract?.image_url,
              payout_address: item?.asset_contract?.payout_address,
              seller_fee_basis_points: item?.asset_contract?.seller_fee_basis_points,
              opensea_seller_fee_basis_points: item?.asset_contract?.opensea_seller_fee_basis_points,
            });

            await db.collection.create({
              nftId: newNFT.id,
              banner_image_url: item?.collection?.banner_image_url,
              created_date: item?.collection?.created_date,
              description: item?.collection?.description,
              slug: item?.collection?.slug,
              name: item?.collection.name,
            });
          }
        } catch (error) {
          next(error);
        }
      });

      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      //! fetching openSea api
      const responseEvents = await EventsApi(owner_address, limit);
      if (responseEvents == null) return res.status(400).json({ mesage: 'event data not get from opensea' });

      await db.ownerPortfolioValue.create({
        owner_address: owner_address,
        total_price: totalPrice,
      });

      return res.status(200).json({ message: 'LoggedIn', token, nonce });
    } catch (error) {
      next(error);
    }
  },

  getOwner: async (req, res, next) => {
    const { owner_address, page = 1, limit = 20 } = req.query;
    if (!owner_address) return res.status(400).send('Invalid Address');
    try {
      const ownerData = await db.owner.findOne({ where: { address: owner_address } });
      if (!ownerData) return res.status(200).json({ payload: [] });

      if (ownerData) {
        const payload = await db.nft.findAll({
          where: { owner_address },
          include: [db.owner, db.creator, db.asset_contract, db.collection],
          // limit: parseInt(limit),
          // offset: (parseInt(page) - 1) * parseInt(limit),
          order: [['createdAt', 'DESC']],
        });
        const count = await db.nft.count();

        return res.status(200).json({ message: 'Owner NFT', count, payload });
      }
    } catch (error) {
      next(error);
    }
  },

  getEvents: async (req, res, next) => {
    const { owner_address } = req.query;
    if (!owner_address) return res.status(400).send('Invalid Address');
    try {
      const ownerData = await db.asset_events.findOne({ where: { owner_address } });
      if (!ownerData) return res.status(200).json({ payload: [] });

      const assetEventData = await db.asset_events.findAll({
        where: { owner_address },
        include: [
          {
            model: db.assets,
            include: [db.asset_contract, db.collection],
          },
          {
            model: db.seller,
          },
          {
            model: db.winner_account,
          },
        ],
        order: [['createdAt', 'DESC']],
      });
      if (!assetEventData) return res.status(400).send('Inavlid Address');

      const count = await db.asset_events.count();
      return res.status(200).json({ message: 'Owner Events', count, payload: assetEventData });
    } catch (error) {
      next(error);
    }
  },

  totalOwnerPortfolioValue: async (req, res, next) => {
    const { owner_address, day } = req.body;
    if (!owner_address) return res.status(400).send('Invalid Address');
    if (day == null) return res.status(400).send('please, provide either one => date, week, month');
    const start = '00:00:00.000Z';
    const end = '23:59:59.000Z';
    try {
      const currentDate = moment();
      const todayDate = moment().format('YYYY-MM-DD');
      const oldDate = currentDate.subtract(parseInt(day), 'days').format('YYYY-MM-DD');

      let where = { owner_address };
      where['createdAt'] = {
        [Op.gte]: `${oldDate}T${start}`,
        [Op.lte]: `${todayDate}T${end}`,
      };

      const totalValue = await db.ownerPortfolioValue.findAll({
        where: where,
        order: [['createdAt', 'DESC']],
      });
      if (!totalValue) return res.status(400).send('Inavlid Address');

      return res.status(200).json({ message: 'Owner Portfolio Value', payload: totalValue });
    } catch (error) {
      next(error);
    }
  },

  netProfitAndLoss: async (req, res, next) => {
    const { netProfitAndLoss, owner_address } = req.body;
    if (!netProfitAndLoss && !owner_address)
      return res.status(400).send('Please Provide owner_address and netProfitAndLoss');
    try {
      const data = await db.netProfitAndLoss.findAll({
        where: {
          owner_address,
        },
      });

      if (data.length === 0) {
        const TotalNetProfitAndLoss = await db.netProfitAndLoss.create({
          owner_address,
          totalNetProfitAndLoss: 0,
        });

        return res
          .status(200)
          .json({ message: 'Your Net Profit and Loss is Zero, Yet!', payload: TotalNetProfitAndLoss });
      }

      const count = await db.netProfitAndLoss.count({
        where: { owner_address },
      });

      const Total = data.at(-1).dataValues.totalNetProfitAndLoss;

      if (netProfitAndLoss === Total) {
        const payload = await db.netProfitAndLoss.findAll({
          where: {
            owner_address,
          },
        });
        return res.status(200).json({ message: 'Net Profit And Loss are Inserted!!', count, payload: payload.at(-2) });
      } else if (netProfitAndLoss !== Total) {
        const TotalNetProfitAndLoss = await db.netProfitAndLoss.create({
          owner_address,
          totalNetProfitAndLoss: netProfitAndLoss,
        });

        if (!TotalNetProfitAndLoss) return res.status(400).send('Invalid Address');

        const payload = await db.netProfitAndLoss.findAll({
          where: {
            owner_address,
          },
        });
        return res.status(200).json({ message: 'Net Profit And Loss are Inserted!!', count, payload: payload.at(-2) });
      }
    } catch (error) {
      next(error);
    }
  },

  refetchOpenseaApiCronJob: async () => {
    try {
      const getAllUsers = await db.owner.findAll({ raw: true, attributes: ['address'] });
      const Length = getAllUsers.length;

      if (Length > 0) {
        for (let i = 0; i < Length; i++) {
          let owner_address = getAllUsers[i].address;

          // fetching data from opensea
          const responsed = await AssetsApi(owner_address, Length, 20);
          if (responsed == null) throw new Error('Empty Data');

          responsed.data.assets.map(async (item) => {
            try {
              // checking old nft
              const oldNFT = await db.nft.findOne({
                where: {
                  owner_address: owner_address,
                  token_id: item?.token_id,
                },
              });

              const oldAssetContractAddress = await db.asset_contract.findOne({
                where: {
                  address: item?.asset_contract?.address,
                },
              });

              if (!oldNFT && !oldAssetContractAddress) {
                // creating new owner
                const newNFT = await db.nft.create({
                  owner_address: owner_address,
                  nft_id: item?.id,
                  image_url: item?.image_url,
                  image_preview_url: item?.image_preview_url,
                  image_thumbnail_url: item?.image_preview_url,
                  image_original_url: item?.image_preview_url,
                  name: item?.name,
                  description: item?.description,
                  permalink: item?.permalink,
                  token_id: item?.token_id,
                });

                await db.owner.create({
                  nftId: newNFT.id,
                  address: owner_address,
                  profile_img_url: item?.owner.profile_img_url,
                });

                await db.creator.create({
                  nftId: newNFT.id,
                  address: item?.creator?.address,
                  profile_img_url: item?.creator?.profile_img_url,
                });

                await db.asset_contract.create({
                  nftId: newNFT.id,
                  address: item?.asset_contract?.address,
                  created_date: item?.asset_contract?.created_date,
                  name: item?.asset_contract?.name,
                  schema_name: item?.asset_contract?.schema_name,
                  description: item?.asset_contract?.description,
                  external_link: item?.asset_contract?.external_link,
                  image_url: item?.asset_contract?.image_url,
                  payout_address: item?.asset_contract?.payout_address,
                  seller_fee_basis_points: item?.asset_contract?.seller_fee_basis_points,
                  opensea_seller_fee_basis_points: item?.asset_contract?.opensea_seller_fee_basis_points,
                });

                await db.collection.create({
                  nftId: newNFT.id,
                  banner_image_url: item?.collection?.banner_image_url,
                  created_date: item?.collection?.created_date,
                  description: item?.collection?.description,
                  slug: item?.collection?.slug,
                  name: item?.collection.name,
                });
              }
            } catch (error) {
              throw new Error(error.message);
            }
          });

          //! fetching openSea api
          const responseEvent = await EventsApi(owner_address, 20);
          if (responseEvent == null) throw new Error('event data not get from opensea');
        }
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
