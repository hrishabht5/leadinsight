# Task Checklists - Step by Step

Use these checklists for common tasks. Copy and follow them exactly.

---

## ✅ Checklist 1: Build a New Feature

### Phase 1: Planning (5 minutes)
- [ ] Type `/plan [describe your feature]`
- [ ] Wait for the plan to be generated
- [ ] Review the plan and confirm it matches your vision
- [ ] Note the key steps from the plan

**Example:**
```
/plan Create a user profile page that shows:
- User avatar, name, email
- Edit button
- Delete account option
- Last login info
```

---

### Phase 2: Architecture Design (10 minutes)
- [ ] Run this prompt:
```
Use Backend Architect from @agency-agents to design the architecture for this feature:
[paste your plan]

Include:
1. Database schema changes
2. API endpoints needed
3. Frontend components
4. Security considerations
```

- [ ] Review the architecture
- [ ] Ask clarifying questions if needed
- [ ] Confirm you understand each part

---

### Phase 3: Security Review (5 minutes)
- [ ] Run this prompt:
```
Use Security specialist from @everything-claude-code to review this design for security issues:
[paste the architecture]

Check for:
1. Authentication & Authorization
2. Data protection
3. Input validation
4. SQL injection risks
5. XSS vulnerabilities
```

- [ ] Note any security concerns
- [ ] Plan fixes if needed

---

### Phase 4: Write Tests First (TDD) (15 minutes)
- [ ] Run this prompt:
```
Use TDD workflow from @superpowers for this feature:

Feature: [your feature description]

Create test cases for:
1. Happy path (everything works)
2. Edge cases (unusual inputs)
3. Error cases (things that fail)
4. Security cases (attempts to break it)

Format: Use [your programming language] test syntax
```

- [ ] Copy the test code
- [ ] Create a test file in your project
- [ ] Run the tests (they should fail - that's expected!)
- [ ] Check that tests are clear and comprehensive

---

### Phase 5: Implement the Feature (30 minutes)
- [ ] Run this prompt:
```
Use [Language Name] rules from @everything-claude-code for this implementation:

Implement this feature to make the tests pass:
[paste your tests]

Requirements:
[paste key requirements from architecture]
```

- [ ] Copy the code
- [ ] Add it to your project
- [ ] Run tests - they should pass now
- [ ] If tests fail, debug and fix

---

### Phase 6: Code Review (10 minutes)
- [ ] Run this prompt:
```
Use code reviewer from @everything-claude-code to review this code:

[paste your code]

Check for:
1. Best practices for [language]
2. Code quality and readability
3. Performance issues
4. Missing error handling
```

- [ ] Read the feedback carefully
- [ ] Note any improvements needed
- [ ] Implement the improvements

---

### Phase 7: Simplify & Clean (5 minutes)
- [ ] Type `/simplify`
- [ ] Paste your final code
- [ ] Review suggestions
- [ ] Apply simplifications if they improve code

---

### Phase 8: Final Security Check (5 minutes)
- [ ] Run this prompt:
```
Use Security specialist from @everything-claude-code for final security audit:

[paste your final code]

Check for any security vulnerabilities.
```

- [ ] Fix any issues found
- [ ] Mark feature as complete

---

## ✅ Checklist 2: Debug a Problem

### Step 1: Describe the Issue (2 minutes)
- [ ] Write down exactly what's happening
- [ ] Include error messages
- [ ] Note when it happens
- [ ] Include what you expected to happen

**Example Format:**
```
Error: "TypeError: Cannot read property 'name' of undefined"
Location: UserProfile component, line 42
When: Clicking the edit button
Expected: Open edit modal
What I see: Page crashes with error
```

---

### Step 2: Investigate with Expert (5 minutes)
- [ ] Run this prompt:
```
Debug this issue:
[paste your issue description]

The code causing the issue:
[paste the problematic code section]

Use [role] from @agency-agents to investigate.
```

- [ ] Read the investigation results
- [ ] Understand the root cause
- [ ] Note the suggested fix

---

### Step 3: Security Check (2 minutes)
- [ ] Run this prompt:
```
Use Security specialist from @everything-claude-code to check if this issue has security implications:

The issue: [one line description]
The code: [paste code]
The fix we're considering: [paste suggested fix]
```

- [ ] Review any security concerns
- [ ] Adjust fix if needed

---

### Step 4: Implement Fix (10 minutes)
- [ ] Apply the suggested fix to your code
- [ ] Test the fix
- [ ] Verify the error is gone
- [ ] Check that related features still work

---

### Step 5: Verify with Code Review (5 minutes)
- [ ] Run this prompt:
```
Use code reviewer from @everything-claude-code to verify this fix:

The issue was: [describe issue]
The fix: [paste your fixed code]

Is this a good solution? Any improvements?
```

- [ ] Apply any suggested improvements
- [ ] Mark the bug as fixed

---

## ✅ Checklist 3: Code Review

### Step 1: Prepare Code (2 minutes)
- [ ] Copy your complete code section
- [ ] Make sure it's formatted nicely
- [ ] Include any context needed (what it does)

---

### Step 2: Quality Review (5 minutes)
- [ ] Run this prompt:
```
Use code reviewer from @everything-claude-code to review this code:

What it does: [brief description]

[paste your code]

Check for:
1. Best practices
2. Code clarity
3. Performance
4. Error handling
5. [Language] standards
```

- [ ] Read all the feedback
- [ ] Understand each suggestion
- [ ] Note the improvements needed

---

### Step 3: Security Audit (3 minutes)
- [ ] Run this prompt:
```
Use Security specialist from @everything-claude-code for security review:

[paste your code]

Check for security vulnerabilities.
```

- [ ] Review all findings
- [ ] Fix any issues
- [ ] Mark vulnerabilities as addressed

---

### Step 4: Simplify (2 minutes)
- [ ] Type `/simplify`
- [ ] Paste your code
- [ ] Apply simplification suggestions
- [ ] Make sure code still works

---

### Step 5: Apply Changes (5 minutes)
- [ ] Implement all improvements
- [ ] Test the updated code
- [ ] Verify it still does what it should
- [ ] Mark review as complete

---

## ✅ Checklist 4: Refactor Code

### Step 1: Analyze Current Code (5 minutes)
- [ ] Review the code you want to refactor
- [ ] Identify the problems (complexity, duplication, etc)
- [ ] List what should improve

---

### Step 2: Get Architecture Guidance (5 minutes)
- [ ] Run this prompt:
```
Use Backend Architect from @agency-agents to suggest refactoring approach:

Current code does: [describe what it does]
Current problems: [list the issues]

[paste your code]

Suggest a better architecture/approach.
```

- [ ] Review the suggestions
- [ ] Understand the new approach

---

### Step 3: Implement Refactoring (20 minutes)
- [ ] Apply the suggested improvements
- [ ] Write tests to verify behavior doesn't change
- [ ] Run tests
- [ ] Make sure all tests pass

---

### Step 4: Code Review (5 minutes)
- [ ] Run this prompt:
```
Use code reviewer from @everything-claude-code to review the refactored code:

[paste your refactored code]
```

- [ ] Apply feedback
- [ ] Mark refactoring as complete

---

## ✅ Checklist 5: Add a Database Feature

### Step 1: Design Schema (5 minutes)
- [ ] Run this prompt:
```
Use Backend Architect from @agency-agents to design a database schema for:
[describe what you need to store]

Include:
1. Table structure
2. Relationships
3. Indexes
4. Constraints
```

- [ ] Review the design
- [ ] Confirm it matches your needs

---

### Step 2: Create Migration (5 minutes)
- [ ] Run this prompt:
```
Use [Language] rules from @everything-claude-code to create a database migration:

Schema needed:
[paste the schema design]

Create a migration file in [Language/Framework syntax]
```

- [ ] Copy the migration code
- [ ] Add it to your migrations folder

---

### Step 3: Test Migration (5 minutes)
- [ ] Run the migration on your test database
- [ ] Verify the schema was created correctly
- [ ] Check that tables and columns exist
- [ ] Check that indexes were created

---

### Step 4: Update Models (10 minutes)
- [ ] Run this prompt:
```
Use [Language] rules from @everything-claude-code to create model/entity code for:

New schema:
[paste schema]

Create model classes/code in [Language syntax]
```

- [ ] Copy the model code
- [ ] Add it to your models folder
- [ ] Test that models work correctly

---

### Step 5: Security Review (5 minutes)
- [ ] Run this prompt:
```
Use Security specialist from @everything-claude-code to review this database change:

New schema: [paste schema]
Migration: [paste migration]
Models: [paste model code]

Check for security issues.
```

- [ ] Fix any issues
- [ ] Mark as secure

---

## ✅ Checklist 6: API Endpoint Development

### Step 1: Plan Endpoint (5 minutes)
- [ ] Run this prompt:
```
/plan Create a [GET/POST/PUT/DELETE] endpoint for:
[describe what the endpoint should do]

Include:
1. What it receives
2. What it returns
3. Error cases
4. Security requirements
```

- [ ] Review the plan
- [ ] Confirm all requirements

---

### Step 2: Design Endpoint (5 minutes)
- [ ] Run this prompt:
```
Use Backend Architect from @agency-agents to design:

Endpoint: [method] /path
Purpose: [what it does]
Inputs: [what it receives]
Outputs: [what it returns]
Security: [security requirements]

Include:
1. Request/response format
2. Error handling
3. Status codes
```

- [ ] Review the design
- [ ] Confirm it's correct

---

### Step 3: Write Tests (10 minutes)
- [ ] Run this prompt:
```
Use TDD workflow from @superpowers for this API endpoint:

Endpoint: [method] /path
Purpose: [what it does]

Create test cases for:
1. Valid request → correct response
2. Missing required field → 400 error
3. Invalid data → 400 error
4. Unauthorized → 401 error
5. Server error → 500 error
```

- [ ] Copy test code
- [ ] Create test file
- [ ] Run tests (should fail)

---

### Step 4: Implement Endpoint (20 minutes)
- [ ] Run this prompt:
```
Use [Language] rules from @everything-claude-code to implement:

Make these tests pass:
[paste your tests]

Endpoint: [method] /path
Purpose: [what it does]
```

- [ ] Copy the code
- [ ] Add to your project
- [ ] Run tests (should pass)

---

### Step 5: Security Review (5 minutes)
- [ ] Run this prompt:
```
Use Security specialist from @everything-claude-code for security audit:

[paste your endpoint code]

Check for:
1. SQL injection risks
2. Authorization checks
3. Input validation
4. Rate limiting
5. CORS issues
```

- [ ] Fix any issues
- [ ] Mark as secure

---

### Step 6: Code Review (5 minutes)
- [ ] Run this prompt:
```
Use code reviewer from @everything-claude-code:

[paste endpoint code]
```

- [ ] Apply feedback
- [ ] Mark complete

---

## 💡 Pro Tips for All Checklists

1. **Follow in order** - Don't skip steps
2. **Copy exact prompts** - They're designed to give best results
3. **Read all feedback** - Even if it seems obvious
4. **Test everything** - Especially security and edge cases
5. **Simplify at the end** - `/simplify` always helps
6. **Ask questions** - If something isn't clear, ask Claude

---

## Quick Command Copy-Paste

**Use this anytime you need an expert:**

```
Use [Expert Name] from @[framework] to [task]:
[your content]
```

**Example:**
```
Use Backend Architect from @agency-agents to review this API design:
[paste your design]
```

---

**You're ready! Start with the feature checklist! 🚀**
