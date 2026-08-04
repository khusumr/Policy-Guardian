# Buggies

# AI Policy Generator

## Overview

The **AI Policy Generator** is a web application that helps HR teams create company policies using AI.

Users complete a **guided questionnaire**, and the application generates a customized policy draft based on their answers.

The application supports policies such as:

* **Work from Home**
* **Travel**
* **Internship**
* **Information Security**

Generated policies can be:

* Reviewed
* Edited
* Approved
* Exported as **Word or PDF documents**

## Why This Project Exists

Creating HR policies manually can be **slow and time-consuming**.

Generic policy templates may not match a company’s:

* Business requirements
* Working style
* Industry
* Employee needs
* Approval processes

This project helps organizations:

* **Create policies faster**
* **Keep policy documents consistent**
* **Customize policies for their organization**
* **Review and update policies easily**
* **Track policy versions and approvals**
* **Store documents securely**
* **Keep humans involved in the review and approval process**

## What This Repository Does

This repository contains the **cloud infrastructure and deployment configuration** for the AI Policy Generator.

It is used to:

* Create Azure resources using **Terraform**
* Deploy infrastructure using **Azure DevOps pipelines**
* Set up **Development, Test, and Production environments**
* Configure security, identities, and access permissions
* Connect the backend application to **Azure OpenAI**
* Set up document storage and application data services
* Configure monitoring, logging, and alerts
* Support repeatable and automated deployments

## Main Azure Services

The project uses the following Azure services:

* **Azure App Service**
  Hosts the frontend and backend applications.

* **Azure OpenAI**
  Generates, reviews, and improves policy documents.

* **Azure Blob Storage**
  Stores templates, policy drafts, and exported documents.

* **Azure SQL Database**
  Stores application data, policy versions, reviews, and approvals.

* **Microsoft Entra ID**
  Provides user authentication and role-based access.

* **Azure Key Vault**
  Stores secrets, certificates, and sensitive configuration.

* **Application Insights**
  Monitors application performance, errors, and availability.

* **Azure DevOps**
  Manages repositories, work items, pipelines, and deployments.

## Deployment Environments

The application will use separate environments:

* **Development** — used for active development
* **Test** — used for integration and user testing
* **Production** — used for the live application

Production deployments should require **manual approval**.

## Security Principles

The project follows these basic security rules:

* Do not store passwords or API keys in Git
* Use **Managed Identity** where possible
* Use **Azure RBAC** with least-privilege access
* Keep Development, Test, and Production access separate
* Store Terraform state securely in Azure Blob Storage
* Require approval before Production deployment
* Do not allow the frontend to connect directly to Azure OpenAI

## Main Goal

The main goal of this repository is to provide a **secure, automated, and repeatable way to deploy the AI Policy Generator on Azure**.

