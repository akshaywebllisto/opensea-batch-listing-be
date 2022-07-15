'use strict';

export default (sequelize, Sequelize) => {
  //root for assets
  const NFT = sequelize.define(
    'nft',
    {
      nft_id: { type: Sequelize.INTEGER },
      owner_address: { type: Sequelize.STRING, allowNull: false },
      image_url: { type: Sequelize.STRING },
      image_preview_url: { type: Sequelize.STRING },
      image_thumbnail_url: { type: Sequelize.STRING },
      image_original_url: { type: Sequelize.STRING },
      name: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      permalink: { type: Sequelize.STRING },
      token_id: { type: Sequelize.STRING },
    },
    {
      timestamps: true,
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    }
  );

  const OwnerPortfolioValue = sequelize.define(
    'ownerPortfolioValue',
    {
      total_price: { type: Sequelize.DOUBLE, defaultValue: 0 },
      owner_address: { type: Sequelize.STRING },
    },
    {
      timestamps: true,
    }
  );

  const Owner = sequelize.define(
    'owner',
    {
      address: { type: Sequelize.STRING, allowNull: false },
      profile_img_url: { type: Sequelize.STRING },
    },
    {
      freezeTableName: true,
      timestamps: true,
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    }
  );

  const Creator = sequelize.define('creator', {
    address: { type: Sequelize.STRING },
    profile_img_url: { type: Sequelize.STRING },
  });

  const Asset_contract = sequelize.define(
    'asset_contract',
    {
      address: { type: Sequelize.TEXT },
      created_date: { type: Sequelize.DATE },
      name: { type: Sequelize.STRING },
      schema_name: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      external_link: { type: Sequelize.STRING },
      image_url: { type: Sequelize.STRING },
      payout_address: { type: Sequelize.TEXT },
      seller_fee_basis_points: { type: Sequelize.INTEGER },
      opensea_seller_fee_basis_points: { type: Sequelize.INTEGER },
    },
    {
      timestamps: true,
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    }
  );

  const Collection = sequelize.define(
    'collection',
    {
      banner_image_url: { type: Sequelize.STRING },
      created_date: { type: Sequelize.DATE },
      description: { type: Sequelize.TEXT },
      slug: { type: Sequelize.STRING },
      name: { type: Sequelize.STRING },
    },
    { timestamps: true, charset: 'utf8', collate: 'utf8_unicode_ci' }
  );
  /////////////////////////////////////////////////////////////////////////////////////////////////////

  const AssetsEvents = sequelize.define(
    'asset_events',
    {
      owner_address: { type: Sequelize.STRING, allowNull: false },
      permalink: { type: Sequelize.STRING },
      token_id: { type: Sequelize.STRING, allowNull: false },
      total_price: { type: Sequelize.BIGINT },
      transaction_block_hash: { type: Sequelize.STRING },
      transaction_block_number: { type: Sequelize.STRING },
    },
    {
      freezeTableName: true,
      timestamps: true,
    }
  );

  const Assets = sequelize.define(
    'assets',
    {
      assets_id: { type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      image_url: { type: Sequelize.STRING },
      image_preview_url: { type: Sequelize.STRING },
      image_thumbnail_url: { type: Sequelize.STRING },
      image_original_url: { type: Sequelize.STRING },
      owner_address: { type: Sequelize.STRING, allowNull: false },
    },
    {
      timestamps: true,
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    }
  );

  const Seller = sequelize.define(
    'seller',
    {
      address: { type: Sequelize.STRING },
      profile_img_url: { type: Sequelize.STRING },
    },
    {
      timestamps: true,
    }
  );

  const WinnerAccount = sequelize.define(
    'winner_account',
    {
      address: { type: Sequelize.STRING },
      profile_img_url: { type: Sequelize.STRING },
    },
    {
      timestamps: true,
    }
  );

  ////////////////////////////////////////////////////////////////
  const NetProfitAndLoss = sequelize.define(
    'netProfitAndLoss',
    {
      totalNetProfitAndLoss: { type: Sequelize.DOUBLE, allowNull: false, defaultValue: 0 },
      owner_address: { type: Sequelize.STRING, allowNull: false },
    },
    {
      timestamps: true,
    }
  );
  //////////////////////////////////////////////////////////////////////////////////////////////

  NFT.hasOne(Owner);
  Owner.belongsTo(NFT);

  NFT.hasOne(Creator);
  Creator.belongsTo(NFT);

  NFT.hasOne(Asset_contract);
  Asset_contract.belongsTo(NFT);

  NFT.hasOne(Collection);
  Collection.belongsTo(NFT);

  //////////////////////////////////////////////////////////////////////////////////////////////

  AssetsEvents.hasOne(Assets);
  Assets.belongsTo(AssetsEvents);

  Assets.hasOne(Asset_contract);
  Asset_contract.belongsTo(Assets);

  Assets.hasOne(Collection);
  Collection.belongsTo(Assets);

  AssetsEvents.hasOne(Seller);
  Seller.belongsTo(AssetsEvents);

  AssetsEvents.hasOne(WinnerAccount);
  WinnerAccount.belongsTo(AssetsEvents);

  //////////////////////////////////////////////////////////////////////////////////////////////

  return {
    Owner,
    OwnerPortfolioValue,
    NFT,
    Creator,
    Asset_contract,
    Collection,
    AssetsEvents,
    Assets,
    Seller,
    WinnerAccount,
    NetProfitAndLoss,
  };
};
