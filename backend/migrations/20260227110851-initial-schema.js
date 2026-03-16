'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create ENUMs native types first (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role" AS ENUM ('SELLER', 'BUYER', 'ADMIN');
      CREATE TYPE "enum_campaigns_status" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');
      CREATE TYPE "enum_order_claims_order_status" AS ENUM ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED');
      CREATE TYPE "enum_order_claims_review_status" AS ENUM ('AWAITING_UPLOAD', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'TIMEOUT');
      CREATE TYPE "enum_order_claims_payout_status" AS ENUM ('NOT_ELIGIBLE', 'PENDING', 'PROCESSED', 'FAILED');
      CREATE TYPE "enum_transactions_type" AS ENUM ('SELLER_CHARGE', 'BUYER_PAYOUT', 'REFUND');
      CREATE TYPE "enum_transactions_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
      CREATE TYPE "enum_notifications_category" AS ENUM (
        'ORDER_APPROVED', 'ORDER_REJECTED',
        'REVIEW_APPROVED', 'REVIEW_REJECTED',
        'PAYOUT_PROCESSED', 'PAYOUT_FAILED',
        'REVIEW_DEADLINE',
        'CAMPAIGN_CREATED', 'CAMPAIGN_PAUSED', 'CAMPAIGN_COMPLETED',
        'NEW_ORDER_CLAIM', 'REVIEW_SUBMITTED',
        'SELLER_PAYMENT_DUE',
        'ADMIN_VERIFICATION_NEEDED', 'ADMIN_FLAGGED_USER',
        'SYSTEM_ANNOUNCEMENT', 'WELCOME'
      );
      CREATE TYPE "enum_notifications_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    `);

    // 2. Create Users Table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: 'enum_users_role',
        allowNull: false,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 3. Create BuyerProfiles Table
    await queryInterface.createTable('buyer_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amazon_profile_url: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stripe_connect_account_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bank_account_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bank_routing_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bank_account_last4: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      on_time_submission_rate: {
        type: Sequelize.FLOAT,
        defaultValue: 100.0,
        allowNull: false,
      },
      is_blacklisted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      blacklist_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      blacklisted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      blacklisted_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      total_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      email_notifications_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 4. Create SellerProfiles Table (includes SP-API fields)
    await queryInterface.createTable('seller_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      stripe_customer_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amzn_selling_partner_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      amzn_refresh_token_encrypted: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      amzn_refresh_token_iv: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      amzn_refresh_token_tag: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      amzn_authorized_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      amzn_authorization_status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 5. Create Campaigns Table
    await queryInterface.createTable('campaigns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'seller_profiles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      asin: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_image_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      product_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      product_rating: {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true,
      },
      product_rating_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      target_reviews: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reimbursement_percent: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      guidelines: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: 'enum_campaigns_status',
        defaultValue: 'ACTIVE',
        allowNull: false,
      },
      stripe_payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 6. Create OrderClaims Table (includes verification tracking fields)
    await queryInterface.createTable('order_claims', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'campaigns',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      buyer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'buyer_profiles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      expected_payout_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      amazon_order_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      order_proof_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      purchase_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      order_status: {
        type: 'enum_order_claims_order_status',
        defaultValue: 'PENDING_VERIFICATION',
        allowNull: false,
      },
      review_proof_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      review_rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      review_title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      review_text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      amazon_review_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      review_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      review_status: {
        type: 'enum_order_claims_review_status',
        defaultValue: 'AWAITING_UPLOAD',
        allowNull: false,
      },
      review_deadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      verified_by_admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      payout_status: {
        type: 'enum_order_claims_payout_status',
        defaultValue: 'NOT_ELIGIBLE',
        allowNull: false,
      },
      verification_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verification_details: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      auto_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      review_verification_method: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      review_verification_details: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      review_auto_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // OrderClaims indexes
    await queryInterface.addIndex('order_claims', ['campaign_id', 'buyer_id'], {
      unique: true,
      name: 'one_claim_per_product_per_buyer',
    });
    await queryInterface.addIndex('order_claims', ['order_status'], { name: 'idx_order_claims_order_status' });
    await queryInterface.addIndex('order_claims', ['review_status'], { name: 'idx_order_claims_review_status' });
    await queryInterface.addIndex('order_claims', ['payout_status'], { name: 'idx_order_claims_payout_status' });

    // 7. Create Transactions Table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      gross_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      platform_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      net_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      type: {
        type: 'enum_transactions_type',
        allowNull: false,
      },
      stripe_transaction_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receipt_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: 'enum_transactions_status',
        defaultValue: 'PENDING',
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 8. Create Notifications Table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category: {
        type: 'enum_notifications_category',
        defaultValue: 'SYSTEM_ANNOUNCEMENT',
        allowNull: false,
      },
      priority: {
        type: 'enum_notifications_priority',
        defaultValue: 'LOW',
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      action_link: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 9. Create AdminAuditLogs Table (target_id is STRING to support non-UUID targets)
    await queryInterface.createTable('admin_audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // AdminAuditLog indexes
    await queryInterface.addIndex('admin_audit_logs', ['admin_id'], { name: 'idx_audit_logs_admin_id' });
    await queryInterface.addIndex('admin_audit_logs', ['action'], { name: 'idx_audit_logs_action' });
    await queryInterface.addIndex('admin_audit_logs', ['created_at'], { name: 'idx_audit_logs_created_at' });

    // 10. Create SystemConfigs Table
    await queryInterface.createTable('system_configs', {
      key: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Seed default platform configuration values
    await queryInterface.bulkInsert('system_configs', [
      {
        key: 'platform_fee_percent',
        value: '10',
        description: 'Platform fee charged as a percentage of total reimbursement cost',
        updated_at: new Date(),
      },
      {
        key: 'auto_order_verification_enabled',
        value: 'true',
        description: 'Enable automatic order verification via Amazon SP-API. Falls back to manual if auto-verification fails.',
        updated_at: new Date(),
      },
      {
        key: 'auto_review_verification_enabled',
        value: 'true',
        description: 'Enable automatic review verification via Amazon profile scraping. Falls back to manual if auto-verification fails.',
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    // Drop tables in reverse order of creation
    await queryInterface.dropTable('system_configs');
    await queryInterface.dropTable('admin_audit_logs');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('order_claims');
    await queryInterface.dropTable('campaigns');
    await queryInterface.dropTable('seller_profiles');
    await queryInterface.dropTable('buyer_profiles');
    await queryInterface.dropTable('users');

    // Drop the ENUM types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_users_role";
      DROP TYPE IF EXISTS "enum_campaigns_status";
      DROP TYPE IF EXISTS "enum_order_claims_order_status";
      DROP TYPE IF EXISTS "enum_order_claims_review_status";
      DROP TYPE IF EXISTS "enum_order_claims_payout_status";
      DROP TYPE IF EXISTS "enum_transactions_type";
      DROP TYPE IF EXISTS "enum_transactions_status";
      DROP TYPE IF EXISTS "enum_notifications_category";
      DROP TYPE IF EXISTS "enum_notifications_priority";
    `);
  }
};
