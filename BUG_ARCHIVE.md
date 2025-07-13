# Bug Archive

This document tracks bugs discovered and fixes applied to the Card Rail project.

## Legend
- 🐛 **Open Bug** - Issue not yet resolved
- ✅ **Fixed** - Issue resolved
- 🔄 **In Progress** - Issue being worked on

## Bug Log

### [NAVIGATION] Back Button Navigation Loop
**Status**: ✅ Fixed  
**Date**: 2025-01-13  
**Description**: After completing sync setup flow (Settings → Generate Passphrase → Sync Success → "I've Saved"), clicking the back button in Settings page would navigate back to the sync success page instead of going to the main page, creating a confusing navigation loop.

**Fix Applied**: 
- Changed `router.push()` to `router.replace()` in sync setup flow to avoid adding pages to browser history
- Changed Settings back button from `router.back()` to `router.push('/')` for predictable navigation
- Updated sync success page navigation to use `router.replace()` 

**Files Modified**: 
- `app/settings/page.tsx` (lines 130, 188)
- `app/sync-success/page.tsx` (lines 31, 52)

---

### [SYNC] Passphrase Generation Always Returns Mock Data  
**Status**: ✅ Fixed  
**Date**: 2025-01-13  
**Description**: The `generatePassphrase()` function always returned the mock "abandon abandon..." passphrase instead of generating real cryptographically secure BIP39 mnemonic phrases in the browser.

**Fix Applied**:
- Fixed environment detection logic in `lib/passphrase.ts`
- Changed condition from `(process.env?.VITEST || !process.versions?.browser)` to just `process.env?.VITEST`
- Now correctly detects test vs browser environment

**Files Modified**:
- `lib/passphrase.ts` (lines 11, 38, 61)

---

## Template for New Bugs

```markdown
### [TYPE] Bug Title
**Status**: 🐛 Open / 🔄 In Progress / ✅ Fixed  
**Date**: YYYY-MM-DD  
**Description**: Clear description of the issue and its impact

**Steps to Reproduce** (if applicable):
1. Step one
2. Step two
3. Expected vs actual behavior

**Fix Applied** (when resolved):
- Description of the solution
- Technical details

**Files Modified**:
- `file/path.ext` (line numbers)

---
```

## Bug Statistics
- **Total Bugs**: 2
- **Fixed**: 2
- **Open**: 0
- **In Progress**: 0