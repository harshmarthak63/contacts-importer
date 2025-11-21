# Sample CSV Files for Testing

I've created two sample CSV files to test the import functionality:

## 1. `sample-contacts.csv`
This file uses standard column names that should be easily recognized by the smart mapping:
- **First Name** → firstName
- **Last Name** → lastName  
- **Phone Number** → phone
- **Email Address** → email
- **Agent Email** → agentUid (will map to user emails)
- **Company** → (can be mapped to a custom field)
- **Job Title** → (can be mapped to a custom field)
- **Notes** → (can be mapped to a custom field)

## 2. `sample-contacts-alt.csv`
This file uses abbreviated/alternative column names to test the smart mapping algorithm:
- **fname** → firstName
- **lname** → lastName
- **mobile** → phone
- **e-mail** → email
- **assigned agent** → agentUid
- **organization** → (custom field)
- **position** → (custom field)
- **comments** → (custom field)

## How to Use

1. **Before importing**, make sure you have users set up:
   - Go to the **Users** page
   - Add at least two users with emails:
     - `agent1@company.com`
     - `agent2@company.com`
   - This will allow the agent mapping to work

2. **Optional - Create Custom Fields**:
   - Go to **Custom Fields** page
   - Add fields like "Company", "Job Title", "Notes" if you want to map those columns

3. **Import the file**:
   - Go to the **Import** page (home page)
   - Upload either CSV file
   - Review the auto-suggested mappings
   - Adjust mappings if needed
   - Click "Import Contacts"

## Testing Scenarios

### Test 1: Standard Column Names
- Use `sample-contacts.csv`
- Should auto-map most fields correctly
- Agent emails should map to users

### Test 2: Alternative Column Names
- Use `sample-contacts-alt.csv`
- Tests the smart mapping algorithm with different header names
- Should still detect phone, email, and name fields

### Test 3: Deduplication
- Import the same file twice
- Second import should merge existing contacts (by phone or email)
- Should show "merged" count in summary

### Test 4: Missing Data
- Edit a CSV to have some rows with missing phone or email
- Those rows should be skipped
- Check the import summary for skipped count

## Notes

- Each file contains 10 sample contacts
- Agent emails reference `agent1@company.com` and `agent2@company.com`
- Make sure these users exist before importing for agent mapping to work
- Phone numbers are in format: 555-0XXX
- All emails are example.com addresses

