<?php

namespace Tests\Feature\NetKeep;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class RestoreRequestTest extends TestCase
{
    use RefreshDatabase;

    private string $inbox;

    protected function setUp(): void
    {
        parent::setUp();
        $this->inbox = storage_path('framework/testing-restore-inbox');
        File::deleteDirectory($this->inbox);
        File::ensureDirectoryExists($this->inbox);
        config(['netkeep.restore_inbox' => $this->inbox]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->inbox);
        parent::tearDown();
    }

    public function test_owner_can_stage_an_encrypted_restore_request_after_recent_reauthentication(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);
        $password = 'restore-password-example';

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('https://localhost/restore', [
                'archive' => UploadedFile::fake()->createWithContent('backup.nkb', 'encrypted archive'),
                'password' => $password,
            ])
            ->assertRedirect()
            ->assertSessionHas('restore_request_uuid');

        $requestPath = (glob($this->inbox.'/.restore-request-*.json') ?: [])[0] ?? null;
        $this->assertIsString($requestPath);
        $contents = File::get($requestPath);
        $this->assertStringNotContainsString($password, $contents);
        $payload = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame($password, Crypt::decryptString($payload['password']));
        $this->assertSame($owner->id, $payload['requested_by']);
    }

    public function test_authenticated_restore_request_requires_https(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Owner]);

        $this->actingAs($owner)
            ->withSession(['auth.password_confirmed_at' => time()])
            ->post('/restore', [
                'archive' => UploadedFile::fake()->createWithContent('backup.nkb', 'encrypted archive'),
                'password' => 'restore-password-example',
            ])
            ->assertForbidden();

        $this->assertCount(0, File::files($this->inbox));
    }

    public function test_installation_token_is_required_without_authentication(): void
    {
        $this->post('/restore', [
            'archive' => UploadedFile::fake()->createWithContent('backup.nkb', 'encrypted archive'),
            'password' => 'restore-password-example',
        ])->assertSessionHasErrors('installation_token');

        $this->assertCount(0, File::files($this->inbox));
    }
}
