import asyncio
import logging

from models.dbs.orm import Orm
from config import raw_regions, raw_sexs, raw_adult_categories, raw_child_categories

logging.basicConfig(level=logging.INFO)


async def main():
    regions = await Orm.get_all_regions()
    if not regions:
        for region in raw_regions:
            await Orm.create_region(region)
        logging.info('Regions added')

    sexs = await Orm.get_all_sexs()
    if not sexs:
        for sex in raw_sexs:
            await Orm.create_sex(sex)
        logging.info('Sexs added')

    adult_categories = await Orm.get_adult_categories()
    if not adult_categories:
        for adult_category in raw_adult_categories:
            await Orm.create_adult_category(adult_category)
        logging.info('Adult categories added')

    child_categories = await Orm.get_child_categories()
    if not child_categories:
        for child_category in raw_child_categories:
            await Orm.create_child_category(child_category)
        logging.info('Child categories added')

    logging.info('Initial data added')

if __name__ == "__main__":
    asyncio.run(main())
