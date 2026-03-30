import { FileInput } from "../types";

export function rankingPrompt(files: FileInput[]): string {
  const fileList = files
    .map((f, i) => `[File ${i + 1}: ${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\``)
    .join("\n\n");

  return `You are a security researcher performing an initial triage of source code files.

For each file below, rate it on a scale of 1 to 5 for how likely it is to contain exploitable security vulnerabilities:
- 5: Very likely (handles user input, auth, database queries, file operations, crypto, deserialization, network requests)
- 4: Likely (complex business logic, data processing, API endpoints)
- 3: Moderate (utility functions with some external interaction)
- 2: Unlikely (mostly internal logic, well-structured)
- 1: Very unlikely (constants, types, simple helpers)

${fileList}

Respond in this exact JSON format:
{
  "rankings": [
    {"fileName": "example.py", "score": 4, "reason": "Handles user authentication and database queries"}
  ]
}`;
}

export function injectionScanPrompt(file: FileInput): string {
  return `You are an expert security researcher specializing in injection vulnerabilities. Audit this code for:

- SQL Injection (including ORM-based)
- Cross-Site Scripting (XSS) - stored, reflected, DOM-based
- Command Injection / OS Command Injection
- Server-Side Template Injection (SSTI)
- LDAP Injection
- XML/XXE Injection
- Path Traversal / Directory Traversal
- Header Injection / CRLF Injection
- Code Injection (eval, exec, dynamic imports)

File: ${file.name}
\`\`\`${file.language}
${file.content}
\`\`\`

For each vulnerability found, respond in this exact JSON format:
{
  "vulnerabilities": [
    {
      "title": "SQL Injection in user login",
      "severity": "critical",
      "description": "The login function concatenates user input directly into a SQL query without parameterization, allowing an attacker to inject arbitrary SQL.",
      "lineStart": 15,
      "lineEnd": 18,
      "vulnerableCode": "query = f\\"SELECT * FROM users WHERE username='{username}'\\"",
      "exploitPoC": "username: ' OR '1'='1' --",
      "category": "injection"
    }
  ]
}

If no vulnerabilities are found, return: {"vulnerabilities": []}
Be thorough but avoid false positives. Only report real, exploitable issues.`;
}

export function authScanPrompt(file: FileInput): string {
  return `You are an expert security researcher specializing in authentication and access control vulnerabilities. Audit this code for:

- Broken Authentication (weak password handling, session management flaws)
- Insecure Direct Object References (IDOR)
- Privilege Escalation (horizontal and vertical)
- Missing Authorization Checks
- Broken Access Control
- Insecure Session Management
- JWT/Token Vulnerabilities (weak signing, no expiry, algorithm confusion)
- Hardcoded Credentials / API Keys
- Insecure Password Storage (plain text, weak hashing)
- Race Conditions in auth flows

File: ${file.name}
\`\`\`${file.language}
${file.content}
\`\`\`

For each vulnerability found, respond in this exact JSON format:
{
  "vulnerabilities": [
    {
      "title": "IDOR in user profile endpoint",
      "severity": "high",
      "description": "The profile endpoint uses a user-supplied ID parameter without verifying the requesting user owns that profile.",
      "lineStart": 42,
      "lineEnd": 48,
      "vulnerableCode": "user = db.get_user(request.params['id'])",
      "exploitPoC": "GET /api/profile/other-user-id with attacker's session token",
      "category": "auth"
    }
  ]
}

If no vulnerabilities are found, return: {"vulnerabilities": []}
Be thorough but avoid false positives. Only report real, exploitable issues.`;
}

export function logicScanPrompt(file: FileInput): string {
  return `You are an expert security researcher specializing in logic and memory safety vulnerabilities. Audit this code for:

- Buffer Overflow / Underflow
- Use-After-Free
- Race Conditions / TOCTOU
- Integer Overflow / Underflow
- Business Logic Flaws (bypassing payment, skipping steps)
- Denial of Service vectors (ReDoS, infinite loops, resource exhaustion)
- Insecure Deserialization
- Type Confusion
- Null Pointer Dereference
- Information Disclosure (verbose errors, stack traces, debug info)
- Insecure Randomness
- Cryptographic Weaknesses

File: ${file.name}
\`\`\`${file.language}
${file.content}
\`\`\`

For each vulnerability found, respond in this exact JSON format:
{
  "vulnerabilities": [
    {
      "title": "ReDoS in email validation",
      "severity": "medium",
      "description": "The regex pattern used for email validation has catastrophic backtracking with specially crafted inputs.",
      "lineStart": 23,
      "lineEnd": 23,
      "vulnerableCode": "re.match(r'^([a-zA-Z0-9]+)*@example.com$', email)",
      "exploitPoC": "email = 'a' * 30 + '@'",
      "category": "logic"
    }
  ]
}

If no vulnerabilities are found, return: {"vulnerabilities": []}
Be thorough but avoid false positives. Only report real, exploitable issues.`;
}

export function critiquePrompt(
  file: FileInput,
  vulnerabilities: Array<{ title: string; severity: string; description: string; category: string; lineStart: number; lineEnd: number; vulnerableCode: string; exploitPoC: string }>
): string {
  return `You are a senior security researcher and code auditor reviewing vulnerability reports for accuracy. Your job is to eliminate false positives and verify exploitability.

Source file: ${file.name}
\`\`\`${file.language}
${file.content}
\`\`\`

Reported vulnerabilities:
${JSON.stringify(vulnerabilities, null, 2)}

For each reported vulnerability:
1. Verify the vulnerable code actually exists at the reported line numbers
2. Confirm the vulnerability is genuinely exploitable in context (not mitigated by other code)
3. Rate your confidence: "high" (definitely exploitable), "medium" (likely exploitable), "low" (possibly exploitable, needs more context)
4. Remove any false positives
5. Adjust severity if needed
6. Deduplicate overlapping findings

Return ONLY verified vulnerabilities in this JSON format:
{
  "verified": [
    {
      "title": "SQL Injection in user login",
      "severity": "critical",
      "confidence": "high",
      "description": "Verified: The login function at line 15 concatenates user input directly into SQL without parameterization. No input sanitization or prepared statements are used anywhere in the call chain.",
      "lineStart": 15,
      "lineEnd": 18,
      "vulnerableCode": "query = f\\"SELECT * FROM users WHERE username='{username}'\\"",
      "exploitPoC": "username: ' OR '1'='1' --",
      "category": "injection"
    }
  ]
}`;
}

export function fixPrompt(
  file: FileInput,
  vulnerability: { title: string; description: string; lineStart: number; lineEnd: number; vulnerableCode: string }
): string {
  return `You are a senior software engineer fixing a security vulnerability.

File: ${file.name}
\`\`\`${file.language}
${file.content}
\`\`\`

Vulnerability: ${vulnerability.title}
Description: ${vulnerability.description}
Affected lines: ${vulnerability.lineStart}-${vulnerability.lineEnd}
Vulnerable code: ${vulnerability.vulnerableCode}

Generate a minimal, correct fix. Show the patched code that replaces the vulnerable section. The fix should:
1. Eliminate the vulnerability completely
2. Preserve the original functionality
3. Follow security best practices for this language
4. Be as minimal as possible (don't refactor unrelated code)

Respond in this JSON format:
{
  "fixedCode": "the corrected code snippet",
  "fixExplanation": "Brief explanation of what was changed and why it's secure"
}`;
}
