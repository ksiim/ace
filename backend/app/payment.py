import asyncio
import json
import aiohttp

from backend.app.core.config import settings


class Payment:

    base_url = "https://enter.tochka.com/uapi"
    jwt_token = settings.JWT_TOKEN
    customer_code = settings.CUSTOMER_CODE
    merchant_id = settings.MERCHANT_ID
    client_id = settings.CLIENT_ID

    async def get_customers_list(self):
        url = f"{self.base_url}/open-banking/v1.0/customers"
        headers = {
            "Authorization": f"Bearer {self.jwt_token}"
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                return await response.json()

    async def create_payment_operation(self, amount):
        url = f"{self.base_url}/acquiring/v1.0/payments"
        headers = await self.generate_headers()
        payload = json.dumps({
            "Data": {
                "customerCode": self.customer_code,
                "amount": amount,
                "purpose": "Оплата за подписку на сервис",
                "paymentMode": [
                    "sbp",
                    "card",
                    # "tinkoff"
                ],
                "merchantId": self.merchant_id
            }
        })

        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, data=payload) as response:
                return await response.json()

    async def generate_headers(self):
        headers = {
            "Authorization": f"Bearer {self.jwt_token}",
            "Content-Type": "application/json"
        }

        return headers

    async def get_payment_link_and_operation_id(self, amount) -> tuple[str, str]:
        response = await self.create_payment_operation(amount)
        link = response["Data"]["paymentLink"]
        operation_id = response["Data"]["operationId"]
        return link, operation_id

    async def get_payment_status(self, operation_id):
        operation_info = await self.get_payment_operation_info(operation_id)
        return operation_info["Data"]["Operation"][0]["status"]

    async def get_payment_operation_info(self, operation_id):
        url = f"{self.base_url}/acquiring/v1.0/payments/{operation_id}"
        headers = {
            "Authorization": f"Bearer {self.jwt_token}"
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                return await response.json()

    async def get_retailers(self):
        url = f"{self.base_url}/acquiring/v1.0/retailers?customerCode={self.customer_code}"
        headers = {
            "Authorization": f"Bearer {self.jwt_token}"
        }

        

    async def create_webhooks(self, webhooks_list: list):
        url = f"{self.base_url}/webhook/v1.0/{self.client_id}"
        payload = json.dumps({
            "webhooksList": webhooks_list,
            "url": "https://ace-deti.ru/api/v1/transactions/webhook"
        })
        headers = await self.generate_headers()
        async with aiohttp.ClientSession() as session:
            async with session.put(url, headers=headers, data=payload) as response:
                return await response.json()
            
