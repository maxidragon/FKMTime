import { DbService } from './../db/db.service';
import { Injectable } from '@nestjs/common';
import { UpdatePersonDto } from './dto/updatePerson.dto';

@Injectable()
export class PersonService {
  constructor(private readonly prisma: DbService) {}

  async getAllPersons(page: number, pageSize: number, search?: string) {
    const whereParams = {};
    if (search) {
      whereParams['OR'] = [
        {
          name: {
            contains: search,
          },
        },
        {
          wcaId: {
            contains: search,
          },
        },
        {
          cardId: {
            equals: search,
          },
        },
      ];
      if (!isNaN(parseInt(search))) {
        whereParams['OR'].push({
          registrantId: parseInt(search),
        });
      }
    }
    const persons = await this.prisma.person.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: whereParams,
    });
    const totalPersons = await this.prisma.person.count();
    return {
      data: persons,
      count: totalPersons,
    };
  }

  async updatePerson(id: number, data: UpdatePersonDto) {
    return await this.prisma.person.update({
      where: { id },
      data: {
        cardId: data.cardId.toString(),
      },
    });
  }

  async getPersonInfo(cardId: string) {
    return await this.prisma.person.findFirst({
      where: {
        cardId,
      },
    });
  }
}
