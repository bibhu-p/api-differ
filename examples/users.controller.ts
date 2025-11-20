import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';

@Controller('users')
export class UsersController {
    @Get()
    findAll(@Query('page') page: number) {
        return [];
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return {};
    }

    @Post()
    create(@Body() createUserDto: any) {
        return {};
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateUserDto: any) {
        return {};
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return {};
    }
}
