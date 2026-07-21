<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class BrandAssetsTest extends TestCase
{
    public function test_favicon_uses_the_netkeep_brand(): void
    {
        $favicon = file_get_contents(dirname(__DIR__, 2).'/public/favicon.svg');

        $this->assertIsString($favicon);
        $this->assertStringContainsString('<title id="title">NetKeep</title>', $favicon);
        $this->assertStringContainsString('#34D399', $favicon);
        $this->assertStringContainsString('#07111F', $favicon);
        $this->assertStringNotContainsString('#FF2D20', $favicon);
    }

    public function test_ico_contains_the_supported_sizes(): void
    {
        $icon = file_get_contents(dirname(__DIR__, 2).'/public/favicon.ico');

        $this->assertIsString($icon);
        $header = unpack('vreserved/vtype/vcount', substr($icon, 0, 6));
        $this->assertSame(['reserved' => 0, 'type' => 1, 'count' => 3], $header);

        foreach ([16, 32, 48] as $index => $size) {
            $entry = 6 + $index * 16;
            $length = unpack('Vvalue', substr($icon, $entry + 8, 4));
            $offset = unpack('Vvalue', substr($icon, $entry + 12, 4));

            $this->assertSame($size, ord($icon[$entry]));
            $this->assertSame($size, ord($icon[$entry + 1]));
            $this->assertGreaterThan(8, $length['value']);
            $this->assertSame("\x89PNG\r\n\x1a\n", substr($icon, $offset['value'], 8));
        }
    }

    public function test_apple_touch_icon_is_180_pixels(): void
    {
        $size = getimagesize(dirname(__DIR__, 2).'/public/apple-touch-icon.png');

        $this->assertIsArray($size);
        $this->assertSame(180, $size[0]);
        $this->assertSame(180, $size[1]);
        $this->assertSame('image/png', $size['mime']);
    }
}
