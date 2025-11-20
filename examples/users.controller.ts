import { Controller, Get, Post, Put, Patch, Param, Body, Query } from '@nestjs/common';

@Controller('users')
export class UsersController {
    @Get()
    findAll(@Query('page') page: number, @Query('limit') limit: number) {
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

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return {};
    }

    // New endpoint
    @Get('search')
    search(@Query('q') query: string) {
        return [];
    }
}

@Controller('products')
export class ProductsController {
    @Get()
    findAll() {
        return [];
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return {};
    }

    @Post()
    create(@Body() createProductDto: any) {
        return {};
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return {};
    }
}
