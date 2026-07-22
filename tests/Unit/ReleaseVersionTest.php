<?php

namespace Tests\Unit;

use App\Services\ReleaseVersion;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ReleaseVersionTest extends TestCase
{
    #[DataProvider('versions')]
    public function test_it_compares_strict_semantic_versions(string $left, string $right, int $expected): void
    {
        $this->assertSame($expected, ReleaseVersion::compare($left, $right));
    }

    /** @return array<string, array{string,string,int}> */
    public static function versions(): array
    {
        return [
            'patch' => ['1.0.2', '1.0.1', 1],
            'prefix' => ['v1.0.2', '1.0.2', 0],
            'minor' => ['1.0.9', '1.1.0', -1],
            'major' => ['2.0.0', '1.99.99', 1],
        ];
    }

    public function test_it_rejects_prerelease_and_incomplete_versions(): void
    {
        $this->assertNull(ReleaseVersion::normalize('1.0'));
        $this->assertNull(ReleaseVersion::normalize('1.0.0-beta.1'));
        $this->assertNull(ReleaseVersion::normalize('../1.0.0'));
    }
}
