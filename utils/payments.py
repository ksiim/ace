import asyncio
import json
import aiohttp
from config import JWT_TOKEN, CUSTOMER_CODE, MERCHANT_ID


class Payment:
    
    base_url = "https://enter.tochka.com/uapi"
    jwt_token = JWT_TOKEN
    customer_code = CUSTOMER_CODE
    merchant_id = MERCHANT_ID
    
    async def get_customers_list(self):
        url = f"{self.base_url}/open-banking/v1.0/customers"
        headers = {
            "Authorization": f"Bearer {self.jwt_token}"
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                return await response.json()
            
    async def create_payment_operation(self, amount, months):
        url = f"{self.base_url}/acquiring/v1.0/payments"
        headers = {
            "Authorization": f"Bearer {self.jwt_token}",
            "Content-Type": "application/json"
        }
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
            
    async def get_payment_link_and_operation_id(self, amount, months):
        response = await self.create_payment_operation(amount, months)
        print(response)
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
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                return await response.json()
        
    
payload = {}
headers = {
'Authorization': f"Bearer {JWT_TOKEN}",
}

'''
{
    "Data":
    {
        "Customer":
        [
            {
                "customerCode":"304507582",
                "customerType":"Business",
                "isResident":true,
                "taxCode":"616116698853",
                "shortName":"Индивидуальный предприниматель Донченко Роман Вадимович",
                "fullName":"Индивидуальный предприниматель Донченко Роман Вадимович",
                "customerOgrn":"324619600133530"
            },
            {
                "customerCode":"304515808",
                "customerType":"Personal",
                "isResident":true,
                "taxCode":"616116698853",
                "shortName":"Донченко Р.В.",
                "fullName":"Донченко Роман Вадимович"
            }
        ]
    },
"Links":
{
    "self":"https://enter.tochka.com/uapi/open-banking/v1.0/customers"
},
"Meta":
{
    "totalPages":1
    }
}'''
