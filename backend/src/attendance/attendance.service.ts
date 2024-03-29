import { HttpException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateAttendaceDto } from './dto/createAttendance.dto';
import { MarkAsPresentDto } from './dto/markAsPresent.dto';
import { AttendanceGateway } from './attendance.gateway';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getTranslation } from '../translations';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: DbService,
    private readonly attendanceGateway: AttendanceGateway,
  ) {}

  async getAttendanceByGroupId(groupId: string) {
    return this.prisma.attendance.findMany({
      where: {
        groupId,
      },
      include: {
        person: true,
        device: true,
      },
    });
  }

  async getAttendanceByPerson(id: string) {
    return this.prisma.attendance.findMany({
      where: {
        person: {
          id: id,
        },
      },
      include: {
        device: true,
      },
    });
  }

  async markAsPresent(data: MarkAsPresentDto) {
    const attendance = await this.prisma.attendance.create({
      data: {
        groupId: data.groupId,
        role: data.role,
        person: {
          connect: {
            registrantId: data.registrantId,
          },
        },
      },
      include: {
        person: true,
      },
    });
    this.attendanceGateway.handleNewAttendance(
      data.groupId,
      attendance.person.id,
    );
    return attendance;
  }

  async createAttendance(data: CreateAttendaceDto) {
    const device = await this.prisma.device.findFirst({
      where: {
        espId: data.espId,
      },
      include: {
        room: true,
      },
    });
    if (!device) {
      throw new HttpException('Device not found', 404);
    }

    const person = await this.prisma.person.findFirst({
      where: {
        cardId: data.cardId.toString(),
      },
    });

    if (!person) {
      throw new HttpException('Person not found', 404);
    }

    const role =
      device.type === 'ATTENDANCE_SCRAMBLER'
        ? 'SCRAMBLER'
        : device.type === 'ATTENDANCE_RUNNER'
          ? 'RUNNER'
          : 'JUDGE';
    this.attendanceGateway.handleNewAttendance(
      device.room.currentGroupId,
      person.id,
    );
    try {
      await this.prisma.attendance.create({
        data: {
          groupId: device.room.currentGroupId,
          role: role,
          device: {
            connect: {
              id: device.id,
            },
          },
          person: {
            connect: {
              id: person.id,
            },
          },
        },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new HttpException(
            {
              message: getTranslation('alreadyCheckedIn', person.countryIso2),
            },
            409,
          );
        }
      }
    }
    return {
      message: getTranslation('attendanceConfirmed', person.countryIso2),
    };
  }
}
