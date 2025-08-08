import os
import json
import httpx
from typing import Dict, Any

from app.core.config import settings

class NLPEngine:
    """
    Natural Language Processing Engine using a powerful LLM to convert text to SQL.
    This version is simplified for a single, powerful entry point.
    """
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.base_url = settings.OPENAI_BASE_URL
        self.model = settings.OPENAI_MODEL_NAME
        
        if not self.api_key:
            raise ValueError("LLM_API_KEY environment variable is required")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # This is your most powerful prompt. We will use it as the main engine.
        self.universal_system_prompt = """You are a MASTER SQL EXPERT capable of generating ANY type of SQL query from basic to most advanced level for a PostgreSQL database. You MUST extract and use ALL specific values mentioned in the user's text.

        Crucially, you MUST generate all database names as lowercase, unquoted identifiers. You must act as a helpful database administrator, applying sensible defaults like Primary Keys, NOT NULL Constraints, VARCHAR Length when a user's request is simple, but always prioritizing their explicit instructions.

 SUPREME CAPABILITIES:
- All DDL (CREATE, ALTER, DROP) and DML (SELECT, INSERT, UPDATE, DELETE) operations.
- Complex JOINs, nested subqueries, window functions, and Common Table Expressions (CTEs).
- Advanced aggregations, set operations, conditional logic, and date/time functions.

 CRITICAL RULES:
1. ALWAYS respond with a JSON object.
2. The generated SQL MUST be for the PostgreSQL dialect.
3. Extract EVERY specific value from user text (names, numbers, dates, strings, conditions).
4. Analyze the user's request and the provided database schema context to produce the most logical and correct query.

 RESPONSE FORMAT (JSON OBJECT ONLY):
{
    "sql": "The complete, optimized PostgreSQL statement.",
    "query_type": "SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, or OTHER",
    "complexity": "basic, intermediate, advanced, or expert",
    "tables_referenced": ["list_of_all_tables_involved"],
    "explanation": "A concise, human-readable explanation of what the query does.",
    "extracted_values": {
        "text_values": ["all string values found"],
        "numeric_values": [all numbers found],
        "date_values": ["all dates found"],
        "conditions": ["all conditions parsed"]
    }
}

 EXAMPLE:
User Input: "Show me the top 3 students from the 'computer science' department with a GPA over 3.8, and include their email."
Schema Context: 
erDiagram
    students {
        int id PK
        varchar name
        varchar email
        decimal gpa
        int department_id FK
    }
    departments {
        int id PK
        varchar name
    }
    students ||--o{ departments : "belongs to"

Example Response:
{
    "sql": "SELECT s.name, s.email, s.gpa FROM students s JOIN departments d ON s.department_id = d.id WHERE d.name = 'computer science' AND s.gpa > 3.8 ORDER BY s.gpa DESC LIMIT 3;",
    "query_type": "SELECT",
    "complexity": "intermediate",
    "tables_referenced": ["students", "departments"],
    "explanation": "Retrieves the name, email, and GPA of the top 3 students from the 'computer science' department who have a GPA greater than 3.8.",
    "extracted_values": {
        "text_values": ["computer science"],
        "numeric_values": [3, 3.8],
        "date_values": [],
        "conditions": ["department is computer science", "gpa > 3.8"]
    }
}
"""

    async def _call_llm_api(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Core function to make an API call to the LLM."""
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.0, # Low temperature for more predictable SQL
                    "max_tokens": 2048,
                    "response_format": {"type": "json_object"}
                }
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                
                response.raise_for_status() # Raises an exception for 4xx/5xx responses
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                return json.loads(content)
                    
        except httpx.HTTPStatusError as e:
            # Provide more detail on HTTP errors
            error_details = e.response.text
            raise Exception(f"LLM API error ({e.response.status_code}): {error_details}")
        except Exception as e:
            raise Exception(f"LLM API call failed: {e}")

    async def generate_sql(self, user_command: str, schema_context: str) -> Dict[str, Any]:
        """
        The primary method to convert a natural language command into a structured SQL response.
        This is the main entry point for the API.
        """
        user_prompt = f"""
        User Command: "{user_command}"

        Current Database Schema:
        {schema_context}

        Please generate the PostgreSQL query based on the user command and the provided schema.
        Follow all rules and the JSON response format precisely.
        """
        
        try:
            return await self._call_llm_api(self.universal_system_prompt, user_prompt)
        except Exception as e:
            # Return a structured error that can be sent to the frontend
            return {
                "sql": f"-- Error generating SQL: {e}",
                "query_type": "ERROR",
                "complexity": "error",
                "tables_referenced": [],
                "explanation": str(e),
                "extracted_values": {}
            }

# A single, reusable instance of the engine
nlp_engine = NLPEngine()

# The function to be imported by the API route
async def convert_nl_to_sql(command: str, schema: str) -> Dict[str, Any]:
    return await nlp_engine.generate_sql(command, schema)