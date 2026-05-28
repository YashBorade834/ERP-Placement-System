import os
from datetime import datetime, timedelta
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from app.config import JWT_SECRET_KEY, JWT_ALGORITHM

router = APIRouter()

# OAuth2 scheme – token endpoint will be /auth/token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=30))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

import os
from app.config import BYPASS_AUTH

# ... existing imports remain

async def get_current_user(token: str = Depends(oauth2_scheme)):
    print("Token Received: ", token)
    print("BYPASS_AUTH: ", BYPASS_AUTH)
    if BYPASS_AUTH and token == "dummy-session-token":
        # Development shortcut – treat as logged‑in admin user when using dummy session
        return {"user_id": 0, "role": "admin"}
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        sub = payload.get("sub")
        
        # Extract the actual integer user_id from the token
        user_id = payload.get("user_id")
        
        if sub is None and user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            
        # Use user_id from token if available, otherwise fallback to sub
        final_user_id = user_id if user_id is not None else sub
        
        # Determine role heuristically if not in payload
        role_from_token = payload.get("role", "")
        if role_from_token:
            role = "admin" if role_from_token.lower() == "admin" else "student"
        else:
            role = "admin" if "admin" in str(sub).lower() else "student"
            
        return {
            "user_id": final_user_id, 
            "role": role,
            "name": payload.get("full_name") or payload.get("name") or sub
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        # Fallback mechanism: Verify against Central Auth if local signature verification fails
        import httpx
        from app.config import AUTH_BACKEND_URL
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{AUTH_BACKEND_URL}/api/v1/auth/me",
                    headers={"Authorization": f"Bearer {token}", "ngrok-skip-browser-warning": "true"},
                    timeout=5.0
                )
            if response.status_code == 200:
                payload = response.json()
                user_id = payload.get("user_id")
                sub = payload.get("sub")
                final_user_id = user_id if user_id is not None else sub
                
                role_from_token = payload.get("role", "")
                if role_from_token:
                    role = "admin" if role_from_token.lower() == "admin" else "student"
                else:
                    role = "admin" if "admin" in str(sub).lower() else "student"
                    
                return {
                    "user_id": final_user_id,
                    "role": role,
                    "name": payload.get("full_name") or payload.get("name") or sub
                }
            else:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token rejected by central auth")
        except httpx.RequestError as e:
            print(f"Auth Fallback Error: {e}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials (Auth server unreachable)")


###################################################################################
def require_admin(user: dict = Depends(get_current_user)):
    role = str(user.get("role", "")).lower()

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return user
###################################################################################


@router.post("/token")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    # NOTE: Replace this stub with real user verification against a users table.
    # For now, accept any username/password and return a token with sub=username.
    # In production you must verify password hash.
    access_token = create_access_token({"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

# New endpoint: return current user info for frontend verification
@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    """Return the decoded user payload (e.g., user_id). Used by the frontend to verify token."""
    return user
