# Testing Bidirectional Parts-Stock Sync

## Test Scenarios

### Test 1: New Part Creation with Initial Inventory

**Scenario**: Create a new part with initial quantity of 100 units

**Steps**:
1. Navigate to Parts module
2. Click "Add Part" 
3. Fill in required fields:
   - Part Number: TEST-001
   - Name: Test Hydraulic Filter
   - SKU: SKU-TEST-001
   - Material Code: MAT-TEST-001
   - Category: Filters
   - Department: Maintenance
   - Supplier: Test Supplier Inc.
   - Quantity: 100
   - Unit Price: 25.00
   - Is Stock Item: ✓ (checked)

**Expected Results**:
- Part created successfully in Parts module
- Stock receipt transaction automatically created (e.g., ST2412001)
- Transaction status: Auto-approved
- Success message: "Part created successfully. Stock receipt transaction created: ST2412001"
- Stock Transactions module shows new receipt transaction
- Part inventory reflects quantity of 100

### Test 2: Part Quantity Update

**Scenario**: Update existing part quantity from 100 to 150 units

**Steps**:
1. Find the test part (TEST-001) in Parts module
2. Click Edit button
3. Change quantity from 100 to 150
4. Save changes

**Expected Results**:
- Part updated successfully
- Stock adjustment transaction created for +50 units
- Success message: "Part updated successfully. Stock adjustment transaction created: ST2412002"
- Stock Transactions module shows new adjustment transaction
- Part inventory reflects quantity of 150

### Test 3: Part Creation with Zero Quantity

**Scenario**: Create a part with zero initial inventory

**Steps**:
1. Create new part with quantity: 0
2. Fill all other required fields

**Expected Results**:
- Part created successfully
- No stock transaction created
- Success message: "Part created successfully"
- No entry in Stock Transactions module

### Test 4: Non-Stock Item Creation

**Scenario**: Create a part marked as non-stock item

**Steps**:
1. Create new part with quantity: 50
2. Uncheck "Is Stock Item" checkbox
3. Fill all other required fields

**Expected Results**:
- Part created successfully
- No stock transaction created
- Success message: "Part created successfully"

### Test 5: Error Handling

**Scenario**: Test sync failure scenarios

**Steps**:
1. Create part while logged out (simulate auth failure)
2. Create part with invalid department permissions

**Expected Results**:
- Appropriate error messages displayed
- Part creation may succeed but with sync warning
- User informed of sync issues

## Verification Checklist

### Parts Module Verification
- [ ] Part appears in parts list
- [ ] All part details saved correctly
- [ ] Quantity reflects intended value
- [ ] Success/error messages display properly

### Stock Transactions Module Verification
- [ ] New transaction appears in stock history
- [ ] Transaction type is correct (receipt/adjustment)
- [ ] Transaction details match part information
- [ ] Transaction status is approved
- [ ] Reference number follows pattern

### Data Consistency Verification
- [ ] Part quantity matches transaction quantity
- [ ] Vendor information synced correctly
- [ ] Department assignments consistent
- [ ] Material codes and SKUs match

### User Experience Verification
- [ ] No noticeable performance impact
- [ ] Clear feedback on sync status
- [ ] Graceful error handling
- [ ] Intuitive workflow maintained

## Manual Test Results Template

```
Test Date: ___________
Tester: _____________

Test 1 - New Part Creation:
- Part Created: [ ] Pass [ ] Fail
- Stock Transaction Created: [ ] Pass [ ] Fail
- Message Displayed: [ ] Pass [ ] Fail
- Notes: ________________________________

Test 2 - Quantity Update:
- Part Updated: [ ] Pass [ ] Fail
- Adjustment Transaction: [ ] Pass [ ] Fail
- Correct Quantity Diff: [ ] Pass [ ] Fail
- Notes: ________________________________

Test 3 - Zero Quantity:
- Part Created: [ ] Pass [ ] Fail
- No Stock Transaction: [ ] Pass [ ] Fail
- Notes: ________________________________

Test 4 - Non-Stock Item:
- Part Created: [ ] Pass [ ] Fail
- No Stock Transaction: [ ] Pass [ ] Fail
- Notes: ________________________________

Test 5 - Error Handling:
- Errors Handled Gracefully: [ ] Pass [ ] Fail
- Messages Clear: [ ] Pass [ ] Fail
- Notes: ________________________________

Overall Assessment:
- Feature Working: [ ] Pass [ ] Fail
- Ready for Production: [ ] Yes [ ] No
- Issues Found: ______________________________
```
