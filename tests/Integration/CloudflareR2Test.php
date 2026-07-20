<?php

namespace Tests\Integration;

use App\Services\SafeHttpClient;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class CloudflareR2Test extends TestCase
{
    protected function setUp(): void
    {
        if (! filter_var(getenv('NETKEEP_R2_TESTS'), FILTER_VALIDATE_BOOL)) {
            $this->markTestSkipped('Cloudflare R2 integration is disabled.');
        }

        parent::setUp();

        Http::swap(new Factory);
    }

    public function test_real_r2_round_trip(): void
    {
        $endpoint = (string) env('NETKEEP_R2_ENDPOINT');
        $bucket = (string) env('NETKEEP_R2_BUCKET');
        $key = (string) env('NETKEEP_R2_ACCESS_KEY');
        $secret = (string) env('NETKEEP_R2_SECRET_KEY');
        $this->assertNotSame('', $endpoint);
        $this->assertNotSame('', $bucket);
        $this->assertNotSame('', $key);
        $this->assertNotSame('', $secret);

        $disk = Storage::build([
            'driver' => 's3',
            'key' => $key,
            'secret' => $secret,
            'region' => 'auto',
            'bucket' => $bucket,
            'endpoint' => $endpoint,
            'use_path_style_endpoint' => true,
            'throw' => true,
            'http' => app(SafeHttpClient::class)->options($endpoint),
        ]);
        $path = 'netkeep-e2e/'.Str::uuid().'.txt';
        $payload = 'NetKeep Cloudflare R2 integration '.Str::uuid();

        try {
            $disk->put($path, $payload);
            $this->assertTrue($disk->fileExists($path));
            $this->assertSame($payload, $disk->get($path));
        } finally {
            $disk->delete($path);
        }

        $this->assertFalse($disk->fileExists($path));
    }
}
