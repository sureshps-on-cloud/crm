import { AccountModel, IAccountDocument } from '../src/models/account.model.js';
import { AccountStatus, OutletType, OutletSize, CustomerTier, PaymentTerms } from '../src/types/account.types.js';
import mongoose from 'mongoose';

describe('Account Model', () => {
  const validAccountData = {
    shopName: 'Al-Faisal Supermarket',
    location: 'King Fahd Road, Riyadh',
    region: 'Central',
    status: AccountStatus.ACTIVE,
    assignedTo: new mongoose.Types.ObjectId().toString(),
    createdBy: new mongoose.Types.ObjectId().toString(),
    outletType: OutletType.SUPERMARKET,
    outletSize: OutletSize.LARGE,
    customerTier: CustomerTier.BRONZE,
    creditLimit: 50000,
    paymentTerms: PaymentTerms.NET_30,
    outstandingBalance: 0
  };

  describe('Model Creation', () => {
    it('should create a valid account with all required fields', async () => {
      const account = new AccountModel(validAccountData);
      const savedAccount = await account.save();

      expect(savedAccount._id).toBeDefined();
      expect(savedAccount.shopName).toBe(validAccountData.shopName);
      expect(savedAccount.location).toBe(validAccountData.location);
      expect(savedAccount.region).toBe(validAccountData.region);
      expect(savedAccount.status).toBe(validAccountData.status);
      expect(savedAccount.assignedTo).toBe(validAccountData.assignedTo);
      expect(savedAccount.createdBy).toBe(validAccountData.createdBy);
      expect(savedAccount.outletType).toBe(validAccountData.outletType);
      expect(savedAccount.outletSize).toBe(validAccountData.outletSize);
      expect(savedAccount.customerTier).toBe(validAccountData.customerTier);
      expect(savedAccount.creditLimit).toBe(validAccountData.creditLimit);
      expect(savedAccount.paymentTerms).toBe(validAccountData.paymentTerms);
      expect(savedAccount.outstandingBalance).toBe(validAccountData.outstandingBalance);
      expect(savedAccount.createdAt).toBeDefined();
      expect(savedAccount.updatedAt).toBeDefined();
    });

    it('should create account with default values', async () => {
      const minimalData = {
        shopName: 'Test Shop',
        location: 'Test Location',
        region: 'Test Region',
        assignedTo: new mongoose.Types.ObjectId().toString(),
        createdBy: new mongoose.Types.ObjectId().toString(),
        outletType: OutletType.LOCAL_VENDOR,
        outletSize: OutletSize.SMALL
      };

      const account = new AccountModel(minimalData);
      const savedAccount = await account.save();

      expect(savedAccount.status).toBe(AccountStatus.ACTIVE);
      expect(savedAccount.customerTier).toBe(CustomerTier.BRONZE);
      expect(savedAccount.creditLimit).toBe(0);
      expect(savedAccount.paymentTerms).toBe(PaymentTerms.CASH_ON_DELIVERY);
      expect(savedAccount.outstandingBalance).toBe(0);
    });
  });

  describe('Validation', () => {
    describe('Required Fields', () => {
      const requiredFields = [
        'shopName',
        'location', 
        'region',
        'assignedTo',
        'createdBy',
        'outletType',
        'outletSize'
      ];

      requiredFields.forEach(field => {
        it(`should require ${field}`, async () => {
          const invalidData = { ...validAccountData };
          delete invalidData[field as keyof typeof invalidData];

          const account = new AccountModel(invalidData);
          
          await expect(account.save()).rejects.toThrow();
        });
      });
    });

    describe('Shop Name Validation', () => {
      it('should reject shop name shorter than 2 characters', async () => {
        const account = new AccountModel({
          ...validAccountData,
          shopName: 'A'
        });

        await expect(account.save()).rejects.toThrow('Shop name must be at least 2 characters long');
      });

      it('should reject shop name longer than 200 characters', async () => {
        const account = new AccountModel({
          ...validAccountData,
          shopName: 'A'.repeat(201)
        });

        await expect(account.save()).rejects.toThrow('Shop name cannot exceed 200 characters');
      });

      it('should trim shop name', async () => {
        const account = new AccountModel({
          ...validAccountData,
          shopName: '  Test Shop  '
        });

        const savedAccount = await account.save();
        expect(savedAccount.shopName).toBe('Test Shop');
      });
    });

    describe('Location Validation', () => {
      it('should reject location shorter than 3 characters', async () => {
        const account = new AccountModel({
          ...validAccountData,
          location: 'AB'
        });

        await expect(account.save()).rejects.toThrow('Location must be at least 3 characters long');
      });

      it('should reject location longer than 300 characters', async () => {
        const account = new AccountModel({
          ...validAccountData,
          location: 'A'.repeat(301)
        });

        await expect(account.save()).rejects.toThrow('Location cannot exceed 300 characters');
      });
    });

    describe('Region Validation', () => {
      it('should reject region shorter than 2 characters', async () => {
        const account = new AccountModel({
          ...validAccountData,
          region: 'A'
        });

        await expect(account.save()).rejects.toThrow('Region must be at least 2 characters long');
      });

      it('should reject region longer than 100 characters', async () => {
        const account = new AccountModel({
          ...validAccountData,
          region: 'A'.repeat(101)
        });

        await expect(account.save()).rejects.toThrow('Region cannot exceed 100 characters');
      });
    });

    describe('ObjectId Validation', () => {
      it('should reject invalid assignedTo ObjectId', async () => {
        const account = new AccountModel({
          ...validAccountData,
          assignedTo: 'invalid-id'
        });

        await expect(account.save()).rejects.toThrow('Assigned to must be a valid MongoDB ObjectId');
      });

      it('should reject invalid createdBy ObjectId', async () => {
        const account = new AccountModel({
          ...validAccountData,
          createdBy: 'invalid-id'
        });

        await expect(account.save()).rejects.toThrow('Created by must be a valid MongoDB ObjectId');
      });

      it('should reject invalid leadId ObjectId', async () => {
        const account = new AccountModel({
          ...validAccountData,
          leadId: 'invalid-id'
        });

        await expect(account.save()).rejects.toThrow('Lead ID must be a valid MongoDB ObjectId');
      });

      it('should accept null leadId', async () => {
        const account = new AccountModel({
          ...validAccountData,
          leadId: null
        });

        const savedAccount = await account.save();
        expect(savedAccount.leadId).toBeNull();
      });
    });

    describe('Enum Validation', () => {
      it('should reject invalid status', async () => {
        const account = new AccountModel({
          ...validAccountData,
          status: 'invalid-status' as any
        });

        await expect(account.save()).rejects.toThrow();
      });

      it('should reject invalid outletType', async () => {
        const account = new AccountModel({
          ...validAccountData,
          outletType: 'invalid-type' as any
        });

        await expect(account.save()).rejects.toThrow();
      });

      it('should reject invalid outletSize', async () => {
        const account = new AccountModel({
          ...validAccountData,
          outletSize: 'invalid-size' as any
        });

        await expect(account.save()).rejects.toThrow();
      });

      it('should reject invalid customerTier', async () => {
        const account = new AccountModel({
          ...validAccountData,
          customerTier: 'invalid-tier' as any
        });

        await expect(account.save()).rejects.toThrow();
      });

      it('should reject invalid paymentTerms', async () => {
        const account = new AccountModel({
          ...validAccountData,
          paymentTerms: 'invalid-terms' as any
        });

        await expect(account.save()).rejects.toThrow();
      });
    });

    describe('Credit Limit Validation', () => {
      it('should reject negative credit limit', async () => {
        const account = new AccountModel({
          ...validAccountData,
          creditLimit: -1000
        });

        await expect(account.save()).rejects.toThrow('Credit limit cannot be negative');
      });

      it('should reject credit limit exceeding maximum', async () => {
        const account = new AccountModel({
          ...validAccountData,
          creditLimit: 1000001
        });

        await expect(account.save()).rejects.toThrow('Credit limit cannot exceed 1,000,000');
      });

      it('should accept zero credit limit', async () => {
        const account = new AccountModel({
          ...validAccountData,
          creditLimit: 0
        });

        const savedAccount = await account.save();
        expect(savedAccount.creditLimit).toBe(0);
      });

      it('should accept maximum credit limit', async () => {
        const account = new AccountModel({
          ...validAccountData,
          creditLimit: 1000000
        });

        const savedAccount = await account.save();
        expect(savedAccount.creditLimit).toBe(1000000);
      });
    });

    describe('Outstanding Balance Validation', () => {
      it('should reject negative outstanding balance', async () => {
        const account = new AccountModel({
          ...validAccountData,
          outstandingBalance: -100
        });

        await expect(account.save()).rejects.toThrow('Outstanding balance cannot be negative');
      });

      it('should reject outstanding balance exceeding credit limit', async () => {
        const account = new AccountModel({
          ...validAccountData,
          creditLimit: 1000,
          outstandingBalance: 1500
        });

        await expect(account.save()).rejects.toThrow('Outstanding balance cannot exceed credit limit');
      });

      it('should accept outstanding balance equal to credit limit', async () => {
        const account = new AccountModel({
          ...validAccountData,
          creditLimit: 1000,
          outstandingBalance: 1000
        });

        const savedAccount = await account.save();
        expect(savedAccount.outstandingBalance).toBe(1000);
      });

      it('should accept zero outstanding balance', async () => {
        const account = new AccountModel({
          ...validAccountData,
          outstandingBalance: 0
        });

        const savedAccount = await account.save();
        expect(savedAccount.outstandingBalance).toBe(0);
      });
    });
  });

  describe('CRUD Operations', () => {
    let savedAccount: IAccountDocument;

    beforeEach(async () => {
      const account = new AccountModel(validAccountData);
      savedAccount = await account.save();
    });

    describe('Read Operations', () => {
      it('should find account by id', async () => {
        const foundAccount = await AccountModel.findById(savedAccount._id);
        expect(foundAccount).toBeTruthy();
        expect(foundAccount!.shopName).toBe(validAccountData.shopName);
      });

      it('should find accounts by status', async () => {
        const accounts = await AccountModel.find({ status: AccountStatus.ACTIVE });
        expect(accounts).toHaveLength(1);
        expect(accounts[0].status).toBe(AccountStatus.ACTIVE);
      });

      it('should find accounts by outlet type', async () => {
        const accounts = await AccountModel.find({ outletType: OutletType.SUPERMARKET });
        expect(accounts).toHaveLength(1);
        expect(accounts[0].outletType).toBe(OutletType.SUPERMARKET);
      });

      it('should find accounts by customer tier', async () => {
        const accounts = await AccountModel.find({ customerTier: CustomerTier.BRONZE });
        expect(accounts).toHaveLength(1);
        expect(accounts[0].customerTier).toBe(CustomerTier.BRONZE);
      });

      it('should find accounts by credit limit range', async () => {
        const accounts = await AccountModel.find({
          creditLimit: { $gte: 40000, $lte: 60000 }
        });
        expect(accounts).toHaveLength(1);
        expect(accounts[0].creditLimit).toBe(50000);
      });

      it('should find accounts with outstanding balance', async () => {
        // Update account to have outstanding balance
        await AccountModel.findByIdAndUpdate(savedAccount._id, { outstandingBalance: 1000 });
        
        const accounts = await AccountModel.find({ outstandingBalance: { $gt: 0 } });
        expect(accounts).toHaveLength(1);
        expect(accounts[0].outstandingBalance).toBe(1000);
      });
    });

    describe('Update Operations', () => {
      it('should update basic account fields', async () => {
        const updatedData = {
          shopName: 'Updated Shop Name',
          status: AccountStatus.PAUSED
        };

        const updatedAccount = await AccountModel.findByIdAndUpdate(
          savedAccount._id,
          updatedData,
          { new: true }
        );

        expect(updatedAccount!.shopName).toBe(updatedData.shopName);
        expect(updatedAccount!.status).toBe(updatedData.status);
        expect(updatedAccount!.updatedAt).not.toEqual(savedAccount.updatedAt);
      });

      it('should update outlet management fields', async () => {
        const updatedData = {
          outletType: OutletType.PREMIUM_OUTLET,
          outletSize: OutletSize.MEDIUM,
          customerTier: CustomerTier.GOLD,
          creditLimit: 75000,
          paymentTerms: PaymentTerms.NET_15
        };

        const updatedAccount = await AccountModel.findByIdAndUpdate(
          savedAccount._id,
          updatedData,
          { new: true }
        );

        expect(updatedAccount!.outletType).toBe(updatedData.outletType);
        expect(updatedAccount!.outletSize).toBe(updatedData.outletSize);
        expect(updatedAccount!.customerTier).toBe(updatedData.customerTier);
        expect(updatedAccount!.creditLimit).toBe(updatedData.creditLimit);
        expect(updatedAccount!.paymentTerms).toBe(updatedData.paymentTerms);
      });

      it('should update outstanding balance within credit limit', async () => {
        const updatedAccount = await AccountModel.findByIdAndUpdate(
          savedAccount._id,
          { outstandingBalance: 25000 },
          { new: true }
        );

        expect(updatedAccount!.outstandingBalance).toBe(25000);
      });

      it('should reject updating outstanding balance above credit limit', async () => {
        await expect(
          AccountModel.findByIdAndUpdate(
            savedAccount._id,
            { outstandingBalance: 75000 },
            { new: true, runValidators: true }
          )
        ).rejects.toThrow('Outstanding balance cannot exceed credit limit');
      });
    });

    describe('Delete Operations', () => {
      it('should delete account by id', async () => {
        await AccountModel.findByIdAndDelete(savedAccount._id);
        
        const deletedAccount = await AccountModel.findById(savedAccount._id);
        expect(deletedAccount).toBeNull();
      });

      it('should delete multiple accounts by criteria', async () => {
        // Create another account
        const anotherAccount = new AccountModel({
          ...validAccountData,
          shopName: 'Another Shop',
          status: AccountStatus.BLOCKED
        });
        await anotherAccount.save();

        // Delete all blocked accounts
        const deleteResult = await AccountModel.deleteMany({ status: AccountStatus.BLOCKED });
        expect(deleteResult.deletedCount).toBe(1);

        // Verify only active account remains
        const remainingAccounts = await AccountModel.find();
        expect(remainingAccounts).toHaveLength(1);
        expect(remainingAccounts[0].status).toBe(AccountStatus.ACTIVE);
      });
    });
  });

  describe('Indexes and Performance', () => {
    it('should have proper indexes for performance', async () => {
      const indexes = await AccountModel.collection.getIndexes();
      
      // Check for basic field indexes
      expect(indexes).toHaveProperty('shopName_1');
      expect(indexes).toHaveProperty('location_1');
      expect(indexes).toHaveProperty('region_1');
      expect(indexes).toHaveProperty('status_1');
      expect(indexes).toHaveProperty('assignedTo_1');
      expect(indexes).toHaveProperty('createdBy_1');
      
      // Check for outlet management indexes
      expect(indexes).toHaveProperty('outletType_1');
      expect(indexes).toHaveProperty('outletSize_1');
      expect(indexes).toHaveProperty('customerTier_1');
      expect(indexes).toHaveProperty('creditLimit_1');
      expect(indexes).toHaveProperty('paymentTerms_1');
      expect(indexes).toHaveProperty('outstandingBalance_1');
    });

    it('should support text search', async () => {
      // Create accounts with different shop names
      const accounts = [
        { ...validAccountData, shopName: 'Al-Faisal Grocery Store' },
        { ...validAccountData, shopName: 'Mohammed Supermarket', location: 'Al-Faisal Street' },
        { ...validAccountData, shopName: 'Central Market', region: 'Al-Faisal District' }
      ];

      for (const accountData of accounts) {
        const account = new AccountModel(accountData);
        await account.save();
      }

      // Search for "Faisal"
      const searchResults = await AccountModel.find({ $text: { $search: 'Faisal' } });
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe('Aggregation and Analytics', () => {
    beforeEach(async () => {
      // Create multiple accounts for aggregation testing
      const accounts = [
        { ...validAccountData, outletType: OutletType.SUPERMARKET, customerTier: CustomerTier.GOLD, creditLimit: 100000 },
        { ...validAccountData, shopName: 'Shop 2', outletType: OutletType.PREMIUM_OUTLET, customerTier: CustomerTier.PLATINUM, creditLimit: 200000 },
        { ...validAccountData, shopName: 'Shop 3', outletType: OutletType.LOCAL_VENDOR, customerTier: CustomerTier.SILVER, creditLimit: 50000 },
        { ...validAccountData, shopName: 'Shop 4', outletType: OutletType.SUPERMARKET, customerTier: CustomerTier.BRONZE, creditLimit: 25000 }
      ];

      for (const accountData of accounts) {
        const account = new AccountModel(accountData);
        await account.save();
      }
    });

    it('should aggregate accounts by outlet type', async () => {
      const aggregation = await AccountModel.aggregate([
        {
          $group: {
            _id: '$outletType',
            count: { $sum: 1 },
            avgCreditLimit: { $avg: '$creditLimit' }
          }
        }
      ]);

      expect(aggregation).toHaveLength(3);
      
      const supermarketGroup = aggregation.find(g => g._id === OutletType.SUPERMARKET);
      expect(supermarketGroup.count).toBe(2);
    });

    it('should aggregate accounts by customer tier', async () => {
      const aggregation = await AccountModel.aggregate([
        {
          $group: {
            _id: '$customerTier',
            count: { $sum: 1 },
            totalCreditLimit: { $sum: '$creditLimit' }
          }
        },
        { $sort: { totalCreditLimit: -1 } }
      ]);

      expect(aggregation).toHaveLength(4);
      expect(aggregation[0]._id).toBe(CustomerTier.PLATINUM);
    });

    it('should calculate total outstanding balance', async () => {
      // Update some accounts to have outstanding balance
      await AccountModel.updateMany(
        { outletType: OutletType.SUPERMARKET },
        { outstandingBalance: 5000 }
      );

      const aggregation = await AccountModel.aggregate([
        {
          $group: {
            _id: null,
            totalOutstanding: { $sum: '$outstandingBalance' },
            totalCredit: { $sum: '$creditLimit' }
          }
        }
      ]);

      expect(aggregation[0].totalOutstanding).toBe(10000); // 2 supermarkets * 5000
      expect(aggregation[0].totalCredit).toBe(375000); // Sum of all credit limits
    });
  });

  describe('Business Logic Validation', () => {
    it('should maintain data consistency during updates', async () => {
      const account = new AccountModel(validAccountData);
      const savedAccount = await account.save();

      // Update credit limit and outstanding balance in separate operations
      await AccountModel.findByIdAndUpdate(savedAccount._id, { creditLimit: 30000 });
      
      // This should fail as outstanding balance would exceed new credit limit
      await expect(
        AccountModel.findByIdAndUpdate(
          savedAccount._id,
          { outstandingBalance: 35000 },
          { runValidators: true }
        )
      ).rejects.toThrow();
    });

    it('should support customer tier progression', async () => {
      const account = new AccountModel({
        ...validAccountData,
        customerTier: CustomerTier.BRONZE
      });
      const savedAccount = await account.save();

      // Upgrade customer tier
      const tiers = [CustomerTier.SILVER, CustomerTier.GOLD, CustomerTier.PLATINUM];
      
      for (const tier of tiers) {
        const updatedAccount = await AccountModel.findByIdAndUpdate(
          savedAccount._id,
          { customerTier: tier },
          { new: true }
        );
        expect(updatedAccount!.customerTier).toBe(tier);
      }
    });

    it('should handle payment terms changes', async () => {
      const account = new AccountModel({
        ...validAccountData,
        paymentTerms: PaymentTerms.CASH_ON_DELIVERY
      });
      const savedAccount = await account.save();

      // Change to credit terms
      const updatedAccount = await AccountModel.findByIdAndUpdate(
        savedAccount._id,
        { 
          paymentTerms: PaymentTerms.NET_30,
          creditLimit: 50000 
        },
        { new: true }
      );

      expect(updatedAccount!.paymentTerms).toBe(PaymentTerms.NET_30);
      expect(updatedAccount!.creditLimit).toBe(50000);
    });
  });
}); 