from enum import unique
from xmlrpc.client import boolean

from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Company(Base):#her we are creating a class named company which is inheriting from the base class which we have created in database.py
    __tablename__ = "companies" #this is the name of the table which will be created in the database

    id = Column(Integer, primary_key=True, index=True) #add unique key + Primary Key
    name = Column(String, nullable=False)  # Removed unique=True to allow same company in multiple locations
    industry = Column(String)
    website = Column(String)
    address = Column(String) # google place API in case of adreess errors
    hr_contact_name = Column(String)
    hr_contact_email = Column(String)
    hr_contact_phone = Column(String)

    is_approved = Column(Boolean, default=False, nullable=False) #this field is used to check whether the company is approved by the admin or not, default value is false and it cannot be null because we want to set the default value to false when a new company is added to the database, this way we can ensure that the company is not approved until the admin approves it
