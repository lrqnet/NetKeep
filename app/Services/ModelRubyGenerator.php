<?php

namespace App\Services;

use Illuminate\Support\Str;

class ModelRubyGenerator
{
    /**
     * @param  array<string, mixed>  $definition
     */
    public function generate(string $slug, array $definition): string
    {
        $class = Str::studly($slug);
        $prompt = $this->rubyString((string) ($definition['prompt'] ?? '[>#]'));
        $comment = $this->rubyString((string) ($definition['comment'] ?? '# '));
        $commands = array_values(array_filter((array) ($definition['commands'] ?? ['show running-config'])));
        $commandLines = collect($commands)
            ->map(fn (mixed $command): string => "  cmd '".$this->rubyString((string) $command)."'")
            ->implode("\n");
        $filters = collect((array) ($definition['filters'] ?? []))
            ->filter(fn (mixed $filter): bool => is_string($filter) && $filter !== '')
            ->map(fn (mixed $filter): string => "    cfg.gsub! Regexp.new('".$this->rubyString((string) $filter)."'), ''")
            ->implode("\n");
        $filterLines = $filters !== '' ? "\n{$filters}" : '';
        $session = collect();
        if (filled($definition['post_login'] ?? null)) {
            $session->push("    post_login '".$this->rubyString((string) $definition['post_login'])."'");
        }
        if ((bool) ($definition['enable'] ?? false)) {
            $session->push(<<<'RUBY'
    if vars :enable
      if vars(:enable).is_a? TrueClass
        post_login 'enable'
      else
        post_login do
          send "enable\r\n"
          cmd vars(:enable)
        end
      end
    end
RUBY);
        }
        if (filled($definition['logout'] ?? null)) {
            $session->push("    pre_logout '".$this->rubyString((string) $definition['logout'])."'");
        }
        $sessionBlock = $session->isEmpty()
            ? ''
            : "\n\n  cfg :ssh do\n".$session->implode("\n")."\n  end";

        return <<<RUBY
class {$class} < Oxidized::Model
  prompt Regexp.new('^.*{$prompt}\\s?$')
  comment '{$comment}'

  cmd :all do |cfg|
    cfg.gsub! /\r/, ''
{$filterLines}
    cfg
  end

{$commandLines}
{$sessionBlock}
end
RUBY;
    }

    private function rubyString(string $value): string
    {
        return str_replace(['\\', "'"], ['\\\\', "\\'"], $value);
    }
}
