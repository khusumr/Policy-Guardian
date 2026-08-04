# Buggies
AI Policy Generator

Overview

The AI Policy Generator is a web application that helps HR teams create company policies using AI.

Users answer a guided questionnaire, and the application generates a policy draft based on their answers.

The application supports policies such as:

Work from Home
Travel
Internship
Information Security

The generated policy can be reviewed, edited, approved, and exported as a Word or PDF document.

Why This Project Exists

Creating HR policies manually can take a lot of time.

Generic policy templates may not match a company’s needs, working style, industry, or employee requirements.

This project helps organizations:

Create policies faster
Keep policies consistent
Customize policies for their organization
Review and update policies easily
Track policy versions and approvals
Store documents securely
What This Repository Does

This repository contains the cloud infrastructure and deployment setup for the AI Policy Generator.

It is used to:

Create Azure resources using Terraform
Deploy infrastructure using Azure DevOps pipelines
Set up Development, Test, and Production environments
Configure security and access
Connect the backend application to Azure OpenAI
Set up storage, monitoring, and logging
Main Azure Services

The project may use:

Azure App Service for hosting the frontend and backend
Azure OpenAI for policy generation
Azure Blob Storage for storing templates and documents
Azure SQL Database for storing application data
Microsoft Entra ID for user login
Azure Key Vault for secrets
Application Insights for monitoring
Azure DevOps for repositories and pipelines
