<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'Full platform administration access.',
            ],
            [
                'name' => 'Moderator',
                'slug' => 'moderator',
                'description' => 'Content and community moderation access.',
            ],
            [
                'name' => 'Volunteer',
                'slug' => 'volunteer',
                'description' => 'Volunteer participation access.',
            ],
            [
                'name' => 'User',
                'slug' => 'user',
                'description' => 'Standard authenticated member access.',
            ],
        ];

        foreach ($roles as $role) {
            Role::query()->updateOrCreate(
                ['slug' => $role['slug']],
                $role,
            );
        }
    }
}