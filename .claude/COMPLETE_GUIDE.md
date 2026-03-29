# Complete Guide: Using Claude Code Optimization Frameworks

## 📚 Table of Contents
1. [Framework Overview](#framework-overview)
2. [Quick Start by Task](#quick-start-by-task)
3. [Detailed Workflows](#detailed-workflows)
4. [How to Reference Frameworks](#how-to-reference-frameworks)
5. [Common Scenarios](#common-scenarios)

---

## Framework Overview

### 1. **everything-claude-code**
**Location:** `/home/user/everything-claude-code`
**Best For:** Specialized expertise, code reviews, language-specific guidance

**What It Contains:**
- **30+ Agents:** Code reviewers, architects, security analysts, language experts
- **135+ Skills:** Patterns, best practices, workflows
- **60+ Commands:** Quick shortcuts for common tasks
- **Language Rules:** TypeScript, Python, Go, Rust, Java, etc.

**Token Savings:** 30-40% by using pre-built agents instead of describing needs

---

### 2. **superpowers**
**Location:** `/home/user/superpowers`
**Best For:** Planning, structured development, architecture decisions

**What It Contains:**
- **Design Phase:** Brainstorming, specification writing
- **TDD Workflow:** Test-driven development guidance
- **Code Review Process:** Systematic peer review methodology
- **Multi-Agent Coordination:** Parallel development patterns

**Token Savings:** 40-60% by planning first before coding

---

### 3. **agency-agents**
**Location:** `/home/user/agency-agents`
**Best For:** Domain expertise, specialized perspectives

**Available Personas:**
- **Engineering:** Frontend Dev, Backend Architect, Mobile Dev, DevOps, Security, AI Engineer
- **Design:** UI Designer, UX Researcher, Brand Strategist, Visual Artist
- **Product:** Product Manager, Trend Researcher, Feedback Synthesizer
- **Sales & Marketing:** Outbound Strategist, Content Creator, Growth Hacker, SEO Expert
- **QA & Operations:** QA Engineer, Accessibility Auditor, Operations Manager

**Token Savings:** 50% by using expert personas instead of custom prompts

---

## Quick Start by Task

### Task 1: Start a New Feature
**Time to complete:** 5-10 minutes with planning

**Step 1: Use /plan mode**
```
/plan Build a user authentication system with JWT tokens
```
This saves 40-60% tokens by designing before coding.

**Step 2: Load relevant agents**
In your prompt, reference:
```
"Use the Backend Architect from @agency-agents to design the architecture"
"Use the Security specialist from @everything-claude-code for security review"
```

**Step 3: Follow TDD workflow**
Reference @superpowers:
```
"Follow the TDD workflow from @superpowers: write tests first, then implementation"
```

**Step 4: Review with code reviewer**
```
"Use the code reviewer agent from @everything-claude-code to review the implementation"
```

---

### Task 2: Debug a Problem
**Time to complete:** 3-5 minutes

**Step 1: Describe the problem**
```
"I'm getting a CORS error when calling the API. Debug this issue."
```

**Step 2: Load security expert**
```
"Use the Security specialist from @everything-claude-code to check for security issues"
```

**Step 3: Get language-specific help**
```
"Use the Python rules from @everything-claude-code for the fix"
```

---

### Task 3: Code Review Your Work
**Time to complete:** 2-3 minutes

**Step 1: Request review**
```
"Use the code reviewer agent from @everything-claude-code to review this code:
[paste your code]"
```

**Step 2: Check quality**
```
"Use /simplify to remove any unnecessary complexity"
```

---

### Task 4: Learn a New Pattern
**Time to complete:** 5 minutes

**Step 1: Reference the skill**
```
"Show me the [Pattern Name] from @superpowers/skills"
```

**Step 2: Apply it**
```
"Apply this pattern to my code: [your code]"
```

---

## Detailed Workflows

### 🏗️ Workflow 1: Building a Complete Feature

```
1. PLAN PHASE (5 min)
   ├─ /plan "Build [Feature Description]"
   ├─ Load Backend Architect from @agency-agents
   ├─ Follow @superpowers design phase
   └─ Create architecture document

2. DESIGN PHASE (10 min)
   ├─ Define data models
   ├─ Plan API endpoints
   ├─ Check with Security from @everything-claude-code
   └─ Document decisions

3. TDD PHASE (20 min)
   ├─ Write tests first (@superpowers TDD workflow)
   ├─ Run tests
   ├─ Make tests pass with minimal code
   └─ Review test coverage

4. IMPLEMENTATION PHASE (30 min)
   ├─ Code the feature
   ├─ Use language rules from @everything-claude-code
   ├─ Run tests continuously
   └─ Keep code simple (@simplify)

5. REVIEW PHASE (10 min)
   ├─ Code review with @everything-claude-code reviewer
   ├─ Security check with Security specialist
   ├─ Performance review
   └─ Fix any issues

6. REFACTOR PHASE (5 min)
   ├─ /simplify to clean up code
   ├─ Remove dead code
   ├─ Optimize performance
   └─ Final checks

TOTAL: ~80 minutes with expert guidance
WITHOUT FRAMEWORKS: ~2-3 hours of trial and error
TOKENS SAVED: 60-70%
```

---

### 🐛 Workflow 2: Debugging an Issue

```
1. IDENTIFY (2 min)
   └─ Describe the bug clearly

2. INVESTIGATE (5 min)
   ├─ Load relevant expert from @agency-agents
   ├─ Check @everything-claude-code rules
   └─ Review error logs

3. ANALYZE (5 min)
   ├─ Security check (Security specialist)
   ├─ Performance check (Architect)
   └─ Code quality check (Code reviewer)

4. FIX (10 min)
   ├─ Implement the fix
   ├─ Test the fix
   └─ Verify no regressions

5. REVIEW (5 min)
   ├─ Code review with @everything-claude-code
   ├─ /simplify
   └─ Final check

TOTAL: ~30 minutes
TOKENS SAVED: 40-50%
```

---

### 📊 Workflow 3: Code Review

```
1. PREPARE (2 min)
   └─ Copy code to review

2. REVIEW WITH AGENT (5 min)
   ├─ "Use code reviewer from @everything-claude-code"
   ├─ Check for bugs
   ├─ Check for style issues
   └─ Check for performance

3. SECURITY CHECK (3 min)
   └─ "Use Security specialist from @everything-claude-code"

4. LANGUAGE STANDARDS (2 min)
   └─ Check @everything-claude-code language rules

5. SIMPLIFY (2 min)
   └─ /simplify to remove unnecessary code

TOTAL: ~15 minutes
TOKENS SAVED: 50%
```

---

## How to Reference Frameworks

### Method 1: Direct Reference in Prompt
```
"Use the Backend Architect from @agency-agents to design this system"
```

### Method 2: List Available Options
```
"Show me available agents from @everything-claude-code"
```

### Method 3: Load Specific Skill
```
"Apply the TDD workflow from @superpowers"
```

### Method 4: Get Language-Specific Help
```
"Use the Python rules from @everything-claude-code for this code:
[code here]"
```

### Method 5: Use Agent Persona
```
"Act as the Frontend Developer from @agency-agents and implement this feature"
```

---

## Common Scenarios

### Scenario 1: Building an API Endpoint

**Your Task:** Create a POST endpoint to create a user

**Steps:**

1. **Plan it:**
```
/plan
Create a POST /users endpoint that:
- Validates input
- Checks for duplicates
- Hashes password
- Returns JWT token
```

2. **Load experts:**
```
"Use Backend Architect from @agency-agents for the design
Use Security specialist from @everything-claude-code for security
Use Python rules from @everything-claude-code"
```

3. **Write tests first:**
```
"Follow TDD workflow from @superpowers:
- Test valid user creation
- Test duplicate email
- Test password hashing
- Test JWT token generation"
```

4. **Implement:**
```
[Write the code based on tests]
```

5. **Review:**
```
"Use code reviewer from @everything-claude-code to review:
[paste code]"
```

---

### Scenario 2: Adding Database Migration

**Your Task:** Add a new column to users table

**Steps:**

1. **Plan:**
```
/plan Add "phone_number" column to users table with proper validation
```

2. **Load architect:**
```
"Use Backend Architect from @agency-agents to review the schema change"
```

3. **Write migration:**
```
"Use Python rules from @everything-claude-code for the migration script"
```

4. **Test:**
```
"Write tests for the migration using TDD workflow from @superpowers"
```

5. **Review:**
```
"Review for safety and performance with code reviewer"
```

---

### Scenario 3: Optimize Performance

**Your Task:** Your API is slow

**Steps:**

1. **Investigate:**
```
"Use Backend Architect from @agency-agents to identify bottlenecks"
```

2. **Get expert opinion:**
```
"Load DevOps specialist from @agency-agents for infrastructure insights"
```

3. **Implement fix:**
```
"Use performance patterns from @everything-claude-code"
```

4. **Test:**
```
"Write performance tests following TDD from @superpowers"
```

5. **Verify:**
```
"Review with code reviewer from @everything-claude-code"
```

---

### Scenario 4: Security Review

**Your Task:** Ensure your code is secure

**Steps:**

1. **Use security expert:**
```
"Use Security specialist from @everything-claude-code to audit this code:
[paste code]"
```

2. **Check for common issues:**
```
"Check for:
- SQL injection
- XSS vulnerabilities
- CSRF protection
- Password security
- Token expiration"
```

3. **Fix issues:**
```
"Implement the security fixes"
```

4. **Verify:**
```
"Re-run security check with Security specialist"
```

---

## Token Efficiency Tips

### ⭐ Best Practices

1. **Always use /plan first**
   - Saves 40-60% tokens
   - Prevents costly rewrites
   - Better overall solution

2. **Reference agents instead of describing needs**
   - "Use Backend Architect" (saves tokens)
   - NOT "Create an architecture that's scalable, maintainable..."

3. **Use language-specific rules**
   - "Use Python rules from @everything-claude-code"
   - Saves tokens on formatting/style explanations

4. **Follow TDD workflow**
   - Tests guide implementation
   - Less back-and-forth
   - Saves 30% tokens

5. **Use /simplify after coding**
   - Removes unnecessary code
   - Improves quality
   - Quick 1-minute pass

---

## Quick Reference Card

### By Language

**Python:**
```
"Use Python rules from @everything-claude-code"
```

**TypeScript/JavaScript:**
```
"Use TypeScript rules from @everything-claude-code"
```

**Go:**
```
"Use Go rules from @everything-claude-code"
```

**Rust:**
```
"Use Rust rules from @everything-claude-code"
```

### By Role

**Frontend Development:**
```
"Act as Frontend Developer from @agency-agents"
```

**Backend Development:**
```
"Act as Backend Architect from @agency-agents"
```

**DevOps:**
```
"Act as DevOps specialist from @agency-agents"
```

**Security:**
```
"Use Security specialist from @everything-claude-code"
```

### By Task

**Planning:** `/plan + @superpowers`
**Coding:** `@everything-claude-code rules + @agency-agents persona`
**Testing:** `@superpowers TDD workflow`
**Review:** `@everything-claude-code reviewer`
**Security:** `@everything-claude-code Security specialist`

---

## Quick Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `/plan` | Plan before coding | `/plan Build user auth` |
| `/simplify` | Clean up code | `/simplify [paste code]` |
| `/fast` | Faster responses | `/fast` |
| `@everything-claude-code` | Reference agents/skills | `Use Python rules from @...` |
| `@superpowers` | Reference workflows | `Follow TDD from @...` |
| `@agency-agents` | Load personas | `Act as Backend Architect from @...` |

---

## Summary

### When to Use Each Framework

| Framework | When | Benefit |
|-----------|------|---------|
| **everything-claude-code** | Code implementation, reviews, language rules | 30-40% token savings, expert guidance |
| **superpowers** | Planning, TDD, workflows | 40-60% token savings, structured approach |
| **agency-agents** | Need domain expertise | 50% token savings, specialized perspectives |

### Expected Token Savings
- Using one framework: 30-40% savings
- Using two frameworks: 50-60% savings
- Using all three strategically: **60-70% savings**

---

## Need More Help?

- **Framework documentation:** Check `/home/user/[framework-name]/README.md`
- **Available agents:** `ls /home/user/everything-claude-code/agents/`
- **Available skills:** `ls /home/user/superpowers/skills/`
- **Available personas:** `ls /home/user/agency-agents/agents/`

**Happy coding! 🚀**
