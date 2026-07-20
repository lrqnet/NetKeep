<?php

namespace Tests\Unit;

use App\Services\ModelRubyGenerator;
use PHPUnit\Framework\TestCase;

class ModelRubyGeneratorTest extends TestCase
{
    public function test_it_generates_a_model_without_interpolating_raw_ruby(): void
    {
        $ruby = (new ModelRubyGenerator)->generate('vendor_edge', [
            'prompt' => "[>#]'; system('touch /tmp/prompt-pwned'); '",
            'commands' => ["show running-config'; system('touch /tmp/pwned'); '"],
            'filters' => ["^secret/'; system('touch /tmp/filter-pwned'); '"],
            'enable' => true,
            'logout' => 'exit',
        ]);

        $this->assertStringContainsString('class VendorEdge < Oxidized::Model', $ruby);
        $this->assertStringContainsString("prompt Regexp.new('^.*[>#]\\'; system(\\'touch /tmp/prompt-pwned\\'); \\'", $ruby);
        $this->assertStringContainsString("\\'; system(\\'touch /tmp/pwned\\'); \\'", $ruby);
        $this->assertStringContainsString('if vars :enable', $ruby);
        $this->assertStringContainsString("pre_logout 'exit'", $ruby);
    }
}
