# Create and verify a customization profile

The standalone CLI creates signed `.thorium` profiles. It requires Node.js 22.2 or newer and runs without Thorium, Electron, or additional npm packages. The repository includes the generated CLI at `scripts/thorium-profile.cjs`; copy that single file wherever you need it. See the [developer guide](../projects/customization-profile-cli/README.md#build-and-check) to rebuild it from source.

The examples use Bash and generic paths. Both PEM key files must be passed explicitly; the CLI does not select keys automatically.

## Sign and verify

```bash
cd /path/to/thorium-reader
cli="$PWD/scripts/thorium-profile.cjs"
input="$PWD/test/customization/profile/thorium_university_press"
key_dir="$PWD/resources/customization-profile-keys/dev"

output_dir="$PWD/projects/customization-profile-cli/dist/generated"
mkdir -p "$output_dir"
output="$output_dir/my-profile.thorium"

node "$cli" pack \
  --input "$input" \
  --output "$output" \
  --private-key "$key_dir/private.pem" \
  --public-key "$key_dir/public.pem"

node "$cli" verify \
  --input "$output" \
  --public-key "$key_dir/public.pem"
```

Packing prints `OUTPUT= <absolute filename>`; verification prints `VERIFIED= <filename>`. Both return exit code 0 on success. Errors go to stderr and return exit code 1.

The output must end in `.thorium`, its parent directory must exist, and existing files are never overwritten. Choose a new filename when repeating the example. For all options, run `node "$cli" --help`.

Only files referenced by the manifest's images, links, and publication images or links are packaged. Declare assets used only by HTML or CSS in the manifest as well. Remote URLs are preserved without downloading them. See [profile screens](customization-profile-screens.md) for HTML and CSS requirements.
