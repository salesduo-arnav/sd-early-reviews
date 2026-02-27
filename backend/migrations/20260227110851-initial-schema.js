'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create ENUMs native types first (PostgreSQL specific)
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role" AS ENUM ('SELLER', 'BUYER', 'ADMIN');
      CREATE TYPE "enum_campaigns_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');
      CREATE TYPE "enum_order_claims_order_status" AS ENUM ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED');
      CREATE TYPE "enum_order_claims_review_status" AS ENUM ('AWAITING_UPLOAD', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'TIMEOUT');
      CREATE TYPE "enum_order_claims_payout_status" AS ENUM ('NOT_ELIGIBLE', 'PENDING', 'PROCESSED', 'FAILED');
      CREATE TYPE "enum_transactions_type" AS ENUM ('SELLER_CHARGE', 'BUYER_PAYOUT', 'REFUND');
      CREATE TYPE "enum_transactions_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
      CREATE TYPE "enum_notifications_type" AS ENUM ('SYSTEM', 'VERIFICATION_UPDATE', 'PAYOUT_ALERT', 'CAMPAIGN_UPDATE', 'ACTION_REQUIRED');
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
      role: {
        type: 'enum_users_role',
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
      total_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 4. Create SellerProfiles Table
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
      product_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
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
        defaultValue: 'DRAFT',
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

    // 6. Create OrderClaims Table
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
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add unique constraint for one_claim_per_product_per_buyer
    await queryInterface.addIndex('order_claims', ['campaign_id', 'buyer_id'], {
      unique: true,
      name: 'one_claim_per_product_per_buyer',
    });

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
      type: {
        type: 'enum_notifications_type',
        defaultValue: 'SYSTEM',
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

    // 9. Create AdminAuditLogs Table
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
        onDelete: 'CASCADE', // Keep logs, or delete? usually 'SET NULL' or 'CASCADE'
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_id: {
        type: Sequelize.UUID,
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
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation
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
      DROP TYPE IF EXISTS "enum_notifications_type";
    `);
  }
};
