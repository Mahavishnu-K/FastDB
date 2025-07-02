# server/app/core/transaction_manager.py
import uuid
import threading
from typing import Dict
from sqlalchemy.engine import Connection

# This will store our active transactions.
# The key is the transaction_id (str), the value is the Connection object.
# Using a lock makes it safe for concurrent requests.
_active_transactions: Dict[str, Connection] = {}
_lock = threading.Lock()

def begin_transaction(connection: Connection) -> str:
    """Starts a transaction, stores the connection, and returns a new transaction ID."""
    with _lock:
        tx_id = str(uuid.uuid4())
        connection.begin() # Start the actual DB transaction
        _active_transactions[tx_id] = connection
        return tx_id

def get_transaction_connection(tx_id: str) -> Connection | None:
    """Retrieves an active connection using its transaction ID."""
    with _lock:
        return _active_transactions.get(tx_id)

def end_transaction(tx_id: str, commit: bool = True):
    """Ends a transaction by committing or rolling back, and cleans up."""
      # Use pop to atomically get the connection and remove it from the dict.
    with _lock:
        connection = _active_transactions.pop(tx_id, None)

    if connection:
        print(f"DEBUG: Ending transaction {tx_id} on connection {id(connection)}. Commit: {commit}")
        try:
            if commit:
                connection.commit()
                print(f"DEBUG: Transaction {tx_id} committed.")
            else:
                connection.rollback()
                print(f"DEBUG: Transaction {tx_id} rolled back.")
        finally:
            # This is the most important line. It returns the connection to the pool.
            connection.close()
            print(f"DEBUG: Connection for transaction {tx_id} closed and returned to pool.")
    else:
        print(f"WARN: Attempted to end non-existent transaction {tx_id}.")