import { DbService } from '../db/db.service';
import { HttpException, Injectable } from '@nestjs/common';
import { UpdatePersonDto } from './dto/updatePerson.dto';
import { AssignManyCardsDto } from './dto/assignManyCards.dto';
import { AddStaffMemberDto } from './dto/addStaffMember.dto';

@Injectable()
export class PersonService {
  constructor(private readonly prisma: DbService) {}

  async getPersons(page: number, pageSize: number, search?: string) {
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
    const totalPersons = await this.prisma.person.count({
      where: whereParams,
    });
    const personsWithoutCardAssigned = await this.prisma.person.count({
      where: {
        OR: [
          {
            cardId: {
              equals: null,
            },
          },
          {
            cardId: {
              equals: '',
            },
          },
          {
            cardId: {
              equals: '0',
            },
          },
        ],
      },
    });
    return {
      data: persons,
      count: totalPersons,
      personsWithoutCardAssigned,
    };
  }

  async getAllPersons() {
    return this.prisma.person.findMany();
  }

  async collectGiftpack(personId: number) {
    await this.prisma.person.update({
      where: { id: personId },
      data: {
        giftpackCollectedAt: new Date(),
      },
    });
    const collectedGiftpacksCount = await this.prisma.person.count({
      where: {
        giftpackCollectedAt: {
          not: null,
        },
      },
    });
    const totalPersonsCount = await this.prisma.person.count();
    return {
      message: 'Giftpack collected',
      collectedGiftpacksCount,
      totalPersonsCount,
    };
  }

  async giftpackCount() {
    const collectedGiftpacksCount = await this.prisma.person.count({
      where: {
        giftpackCollectedAt: {
          not: null,
        },
      },
    });
    const totalPersonsCount = await this.prisma.person.count();
    const personsWithoutGiftpackCollected = await this.prisma.person.findMany({
      where: {
        giftpackCollectedAt: {
          equals: null,
        },
      },
      select: {
        id: true,
        name: true,
        registrantId: true,
        wcaId: true,
      },
    });
    return {
      collectedGiftpacksCount,
      totalPersonsCount,
      personsWithoutGiftpackCollected,
    };
  }

  async getPersonsWithoutCardAssigned() {
    return this.prisma.person.findMany({
      where: {
        OR: [
          {
            cardId: {
              equals: null,
            },
          },
          {
            cardId: {
              equals: '',
            },
          },
          {
            cardId: {
              equals: '0',
            },
          },
        ],
      },
    });
  }

  async assignManyCards(data: AssignManyCardsDto) {
    const transactions = data.persons.map((person) => {
      return this.prisma.person.update({
        where: { id: person.id },
        data: {
          cardId: person.cardId.toString(),
        },
      });
    });
    return this.prisma.$transaction(transactions);
  }

  async updatePerson(id: number, data: UpdatePersonDto) {
    return this.prisma.person.update({
      where: { id },
      data: {
        cardId: data.cardId.toString(),
      },
    });
  }

  async getPersonInfo(cardId: string) {
    const person = await this.prisma.person.findFirst({
      where: {
        cardId,
      },
      select: {
        id: true,
        registrantId: true,
        wcaId: true,
        name: true,
        countryIso2: true,
        gender: true,
        canCompete: true,
      },
    });
    if (!person) {
      throw new HttpException(
        {
          message: 'Competitor not found',
          shouldResetTime: false,
        },
        404,
      );
    }
    return {
      ...person,
      name: this.convertPolishToLatin(person.name),
    };
  }

  async addStaffMember(data: AddStaffMemberDto) {
    return this.prisma.person.create({
      data: {
        name: data.name,
        gender: data.gender,
        canCompete: false,
      },
    });
  }

  async getPersonInfoWithSensitiveData(cardId: string) {
    const person = await this.prisma.person.findFirst({
      where: {
        cardId,
      },
      select: {
        id: true,
        registrantId: true,
        wcaId: true,
        name: true,
        countryIso2: true,
        birthdate: true,
        giftpackCollectedAt: true,
      },
    });
    if (!person) {
      throw new HttpException(
        {
          message: 'Competitor not found',
          shouldResetTime: false,
        },
        404,
      );
    }
    return person;
  }

  private convertPolishToLatin(text: string) {
    const letters = [
      'ą',
      'ć',
      'ę',
      'ł',
      'ń',
      'ó',
      'ś',
      'ź',
      'ż',
      'Ą',
      'Ć',
      'Ę',
      'Ł',
      'Ń',
      'Ó',
      'Ś',
      'Ź',
      'Ż',
    ];
    const replacement = [
      'a',
      'c',
      'e',
      'l',
      'n',
      'o',
      's',
      'z',
      'z',
      'A',
      'C',
      'E',
      'L',
      'N',
      'O',
      'S',
      'Z',
      'Z',
    ];

    let result = text;

    for (let i = 0; i < letters.length; ++i) {
      result = result.replaceAll(letters[i], replacement[i]);
    }

    return result;
  }
}
