import DolphinToolHelp from '../../src/dolphin-tool/dolphinToolHelp.js';

it('should print the help message', async () => {
  try {
    await DolphinToolHelp.help();
  } catch (error) {
    // eslint-disable-next-line jest/no-conditional-expect
    expect(error).toBeTruthy();
    console.log(error);
    return;
  }
  throw new Error('help should have thrown');
});
