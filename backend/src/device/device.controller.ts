import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { DeviceService } from './device.service';
import { DeviceDto } from './dto/device.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminOrDelegateGuard } from '../auth/guards/adminOrDelegate.guard';
import { UpdateBatteryPercentageDto } from './dto/updateBatteryPercentage.dto';
import { RequestToConnectDto } from './dto/requestToConnect.dto';
import { DeviceGateway } from './device.gateway';

@Controller('device')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly deviceGateway: DeviceGateway,
  ) {}

  @UseGuards(AuthGuard('jwt'), AdminOrDelegateGuard)
  @Get()
  async getAllDevices() {
    return this.deviceService.getAllDevices();
  }

  @UseGuards(AdminGuard)
  @Post()
  async createDevice(@Body() data: DeviceDto) {
    return this.deviceService.createDevice(data);
  }

  @Post('battery')
  async updateBatteryPercentage(@Body() data: UpdateBatteryPercentageDto) {
    return this.deviceService.updateBatteryPercentage(data);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  async updateDevice(@Param('id') id: string, @Body() data: DeviceDto) {
    return this.deviceService.updateDevice(id, data);
  }

  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteDevice(@Param('id') id: string) {
    return this.deviceService.deleteDevice(id);
  }

  @Post('connect')
  async requestToConnect(@Body() data: RequestToConnectDto) {
    return this.deviceService.requestToConnect(data);
  }
}
